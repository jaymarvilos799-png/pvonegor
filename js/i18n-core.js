/* ---------- Language switcher: English / Tagalog / Bisaya ----------
   Translations live in js/i18n-dict.js (PVO_I18N_DICT), keyed by the
   English text. Anything without a translation simply stays in English. */
(function () {
  var LANGS = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'tl', label: 'Tagalog', short: 'TL' },
    { code: 'ceb', label: 'Bisaya', short: 'BIS' }
  ];
  var IDX = { tl: 0, ceb: 1 };
  var INLINE = { STRONG:1, EM:1, B:1, I:1, BR:1, A:1, SPAN:1, SUP:1, SUB:1, ABBR:1, TIME:1, SMALL:1, MARK:1, U:1 };
  var SKIP = { SCRIPT:1, STYLE:1, SVG:1, NOSCRIPT:1, TEXTAREA:1, INPUT:1, SELECT:1, OPTION:1, CODE:1 };
  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function inlineOnly(el) {
    var all = el.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) { if (!INLINE[all[i].tagName.toUpperCase()]) return false; }
    return true;
  }
  function hasText(el) { return /\S/.test(el.textContent || ''); }
  // Collect translatable units under root: whole elements with only inline markup,
  // otherwise individual text nodes.
  function collect(root) {
    var units = [];
    (function walk(node) {
      if (node.nodeType === 1) {
        var tag = node.tagName.toUpperCase();
        if (SKIP[tag] || node.hasAttribute('data-i18n-skip') || node.classList.contains('lang-switch')) return;
        if (node !== root && hasText(node) && inlineOnly(node) && !INLINE[tag] && !node.querySelector('[data-i18n-skip]')) {
          var el = node;
          while (el.children.length === 1 && !Array.prototype.some.call(el.childNodes, function (c) { return c.nodeType === 3 && /\S/.test(c.nodeValue); })) el = el.children[0];
          units.push({ type: 'el', node: el, key: norm(el.innerHTML) });
          return;
        }
        for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
      } else if (node.nodeType === 3 && /\S/.test(node.nodeValue)) {
        units.push({ type: 'text', node: node, key: norm(node.nodeValue) });
      }
    })(root);
    return units;
  }
  window.PVO_I18N_collect = function (root) { return collect(root || document.body).map(function (u) { return u.key; }); };
  window.PVO_I18N_collectIn = function (sels) {
    return collect(document.body).filter(function (u) {
      var el = u.node.nodeType === 1 ? u.node : u.node.parentElement;
      return sels.some(function (s) { return el.closest(s); });
    }).map(function (u) { return u.key; });
  };

  var units = null, current = 'en';
  var dict = window.PVO_I18N_DICT || {};
  var ATTRS = ['aria-label', 'title', 'placeholder', 'data-tip'];
  function tr(key, lang) { var e = dict[key]; return e && lang !== 'en' ? e[IDX[lang]] : null; }
  window.PVO_T = function (english) { var t = tr(norm(english), current); return t || english; };

  function apply(lang) {
    if (!units) {
      units = collect(document.body);
      units.forEach(function (u) { u.orig = u.type === 'el' ? u.node.innerHTML : u.node.nodeValue; });
    }
    units.forEach(function (u) {
      var t = tr(u.key, lang);
      if (u.type === 'el') { u.node.innerHTML = t || u.orig; }
      else {
        if (!t) { u.node.nodeValue = u.orig; return; }
        var m = u.orig.match(/^(\s*)[\s\S]*?(\s*)$/);
        u.node.nodeValue = m[1] + t + m[2];
      }
    });
    document.querySelectorAll('[aria-label],[title],[placeholder],[data-tip]').forEach(function (el) {
      ATTRS.forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        var k = 'data-i18n-orig-' + a;
        if (!el.hasAttribute(k)) el.setAttribute(k, el.getAttribute(a));
        var o = el.getAttribute(k), t = tr(norm(o), lang);
        el.setAttribute(a, t || o);
      });
    });
    current = lang;
    document.documentElement.lang = lang === 'ceb' ? 'ceb' : lang === 'tl' ? 'tl' : 'en';
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.setAttribute('aria-pressed', String(on)); b.classList.toggle('active', on);
    });
    document.dispatchEvent(new CustomEvent('pvo:lang', { detail: lang }));
  }
  window.PVO_setLang = apply;

  // Switcher in the top bar (all pages)
  var bar = document.querySelector('.govph-bar .wrap');
  if (bar) {
    var box = document.createElement('div');
    box.className = 'lang-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Language / Wika / Pinulongan');
    box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>' +
      LANGS.map(function (l) { return '<button type="button" data-lang="' + l.code + '" lang="' + l.code + '" aria-pressed="false" title="' + l.label + '"><span class="ls-long">' + l.label + '</span><span class="ls-short">' + l.short + '</span></button>'; }).join('');
    bar.appendChild(box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lang]'); if (!b) return;
      var lang = b.getAttribute('data-lang');
      try { localStorage.setItem('pvo-lang', lang); } catch (err) {}
      apply(lang);
    });
  }
  var saved = 'en';
  try { saved = localStorage.getItem('pvo-lang') || 'en'; } catch (err) {}
  if (saved !== 'en' && IDX[saved] !== undefined) apply(saved);
  else document.querySelectorAll('.lang-switch button[data-lang="en"]').forEach(function (b) { b.setAttribute('aria-pressed', 'true'); b.classList.add('active'); });
})();
