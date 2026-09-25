/* Translation helper (language switcher, js/i18n-core.js). Falls back to English. */
function PVO_tr(s, n) { var t = window.PVO_T ? window.PVO_T(s) : s; return n === undefined ? t : t.replace('{n}', n); }

(function () {
  'use strict';

  /* ---------- Main menu: mobile toggle + dropdowns ---------- */
  var navbar = document.getElementById('navbar');
  var toggle = document.getElementById('navToggle');
  var subs = Array.prototype.slice.call(document.querySelectorAll('.has-sub'));

  function closeSubs(except) {
    subs.forEach(function (li) {
      if (li === except) return;
      li.classList.remove('open');
      var b = li.querySelector('.sub-toggle');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  function closeMenu() {
    if (!navbar) return;
    navbar.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    closeSubs();
  }

  if (toggle && navbar) {
    toggle.addEventListener('click', function () {
      var open = navbar.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open) closeSubs();
    });
  }
  subs.forEach(function (li) {
    var btn = li.querySelector('.sub-toggle');
    btn.addEventListener('click', function () {
      var open = !li.classList.contains('open');
      closeSubs(li);
      li.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Keyboard: arrow down opens and moves into the submenu
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        closeSubs(li);
        li.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        var first = li.querySelector('.submenu a');
        if (first) first.focus();
      }
    });
    li.addEventListener('keydown', function (e) {
      var links = Array.prototype.slice.call(li.querySelectorAll('.submenu a'));
      var i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && i > -1) { e.preventDefault(); (links[i + 1] || links[0]).focus(); }
      if (e.key === 'ArrowUp' && i > -1) { e.preventDefault(); (links[i - 1] || links[links.length - 1]).focus(); }
    });
    // Close when focus leaves the item (desktop)
    li.addEventListener('focusout', function (e) {
      if (!li.contains(e.relatedTarget) && window.matchMedia('(min-width: 1081px)').matches) {
        li.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openLi = document.querySelector('.has-sub.open');
    if (openLi) { closeSubs(); openLi.querySelector('.sub-toggle').focus(); }
    else if (navbar && navbar.classList.contains('open')) { closeMenu(); if (toggle) toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (navbar && !navbar.contains(e.target)) closeMenu();
  });
  document.querySelectorAll('.menu a').forEach(function (a) {
    a.addEventListener('click', function () { closeMenu(); });
  });

  /* ---------- Tabs (disease reports, organization) ---------- */
  function bindTabs(tabSel, panelSel, attr, prefix) {
    document.querySelectorAll(tabSel).forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll(tabSel).forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll(panelSel).forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = document.getElementById(prefix + tab.dataset[attr]);
        if (panel) panel.classList.add('active');
      });
    });
  }
  bindTabs('.dz-tab', '.dz-panel', 'dz', 'dzpanel-');

  /* Status report / About switch inside each disease tab */
  function showDzView(id) {
    var view = document.getElementById(id); if (!view) return;
    var panel = view.closest('.dz-panel');
    panel.querySelectorAll('.dz-view').forEach(function (v) { v.classList.toggle('active', v === view); });
    panel.querySelectorAll('.dz-view-btn').forEach(function (b) {
      var on = b.getAttribute('aria-controls') === id;
      b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on));
    });
  }
  document.querySelectorAll('.dz-view-btn').forEach(function (b) {
    b.addEventListener('click', function () { showDzView(b.getAttribute('aria-controls')); });
  });
  bindTabs('.org-tab', '.org-panel', 'tab', 'panel-');

  /* ---------- Deep links: #rabies, #ext, #svc-health, #rabies-exposed-dog ---------- */
  function openHash() {
    var h = decodeURIComponent((location.hash || '').slice(1));
    if (!h) return;
    var tab = document.querySelector('.dz-tab[data-dz="' + h + '"], .org-tab[data-tab="' + h + '"]');
    var target = tab;
    if (tab) {
      tab.click();
    } else {
      target = document.getElementById(h);
      if (!target) return;
      var panel = target.closest('.dz-panel');
      if (panel && !panel.classList.contains('active')) {
        var t = document.querySelector('.dz-tab[data-dz="' + panel.id.replace('dzpanel-', '') + '"]');
        if (t) t.click();
      }
      var view = target.closest('.dz-view');
      if (view && !view.classList.contains('active')) showDzView(view.id);
      if (target.tagName === 'DETAILS') target.open = true;
      for (var d = target.parentElement; d; d = d.parentElement) { if (d.tagName === 'DETAILS') d.open = true; }
    }
    requestAnimationFrame(function () { target.scrollIntoView({ block: 'start' }); });
  }
  window.addEventListener('hashchange', openHash);
  if (location.hash) window.addEventListener('load', openHash);
  // Clicking a link to the hash already in the address bar should still work
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash && url.hash === location.hash) {
      e.preventDefault();
      openHash();
    }
  });

  /* ---------- Homepage carousel ---------- */
  var car = document.querySelector('.carousel');
  if (car) {
    var slides = car.querySelectorAll('.slide');
    var dots = car.querySelectorAll('.car-dot');
    var pauseBtn = car.querySelector('[data-car="pause"]');
    var idx = 0, timer = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var userPaused = reduce;
    var DELAY = 7000;

    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === idx;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        s.querySelectorAll('a, button').forEach(function (el) { el.tabIndex = on ? 0 : -1; });
      });
      dots.forEach(function (d, i) {
        if (i === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }
    function stop() { clearInterval(timer); timer = null; }
    function start() { stop(); if (!userPaused) timer = setInterval(function () { show(idx + 1); }, DELAY); }
    function setPaused(p) {
      userPaused = p;
      pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
      pauseBtn.setAttribute('aria-label', p ? 'Play automatic slides' : 'Pause automatic slides');
      p ? stop() : start();
    }

    car.querySelector('[data-car="prev"]').addEventListener('click', function () { show(idx - 1); start(); });
    car.querySelector('[data-car="next"]').addEventListener('click', function () { show(idx + 1); start(); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); start(); }); });
    pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });
    car.addEventListener('mouseenter', stop);
    car.addEventListener('mouseleave', start);
    car.addEventListener('focusin', stop);
    car.addEventListener('focusout', function (e) { if (!car.contains(e.relatedTarget)) start(); });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(idx - 1); }
      if (e.key === 'ArrowRight') { show(idx + 1); }
    });

    show(0);
    setPaused(userPaused);
  }
})();

/* ---------- Photo galleries + lightbox ---------- */
(function () {
  var box = document.getElementById('lightbox');
  var img = box && box.querySelector('img'), cap = box && box.querySelector('figcaption');
  var set = [], i = 0, opener = null;

  if (!box || typeof box.showModal !== 'function') return;
  function show(n) {
    i = (n + set.length) % set.length;
    var t = set[i];
    img.src = t.dataset.full; img.alt = t.querySelector('img').alt;
    var many = set.length > 1;
    cap.innerHTML = t.dataset.cap + (many ? ' <span style="opacity:.7">(' + (i + 1) + ' of ' + set.length + ')</span>' : '') +
      (t.classList.contains('lb-single') ? ' <a href="' + t.dataset.full + '" target="_blank" rel="noopener" style="color:inherit; margin-left:6px;">Open in new tab</a>' : '');
    box.querySelectorAll('.lb-nav').forEach(function (b) { b.hidden = !many; });
    box.classList.toggle('lb-tall', t.classList.contains('lb-single'));
    if (!many) box.scrollTop = 0;
  }
  document.querySelectorAll('.rm-tile').forEach(function (t) {
    t.addEventListener('click', function () {
      set = Array.prototype.slice.call(t.closest('.rm-grid').querySelectorAll('.rm-tile'));
      opener = t; show(set.indexOf(t)); box.showModal();
    });
  });
  document.querySelectorAll('.lb-single').forEach(function (t) {
    t.addEventListener('click', function () { set = [t]; opener = t; show(0); box.showModal(); });
  });
  box.querySelector('.lb-close').addEventListener('click', function () { box.close(); });
  box.querySelector('.lb-prev').addEventListener('click', function () { show(i - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(i + 1); });
  box.addEventListener('keydown', function (e) {
    if (set.length < 2) return;
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
  box.addEventListener('close', function () { if (opener) opener.focus(); });
})();

/* ---------- Disease alerts strip (all pages) ----------
   Edit the three alerts below; every page updates. level: active | clear | watch */
(function () {
  var ALERTS = [
    { level: 'active', name: 'ASF', text: 'Active in 36 barangays, 8 LGUs', date: '4 Sep 2026', href: 'disease-status.html#asf' },
    { level: 'clear',  name: 'Avian influenza', text: 'No reported cases', date: '11 Sep 2026', href: 'disease-status.html#avian' },
    { level: 'watch',  name: 'Rabies', text: 'Vaccinate dogs and cats yearly', date: '', href: 'disease-status.html#rabies-exposed-dog' }
  ];
  var navbar = document.getElementById('navbar');
  if (!navbar) return;
  var bar = document.createElement('div');
  bar.className = 'alert-strip';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Latest disease alerts');
  var html = '<div class="wrap"><span class="as-label">Disease alerts</span><ul>';
  ALERTS.forEach(function (a) {
    html += '<li><a class="as-item as-' + a.level + '" href="' + a.href + '"><span class="dot" aria-hidden="true"></span>' +
      '<strong>' + a.name + '</strong><span class="as-text">' + a.text + '</span>' + (a.date ? '<time>' + a.date + '</time>' : '') + '</a></li>';
  });
  bar.innerHTML = html + '</ul></div>';
  navbar.parentNode.insertBefore(bar, navbar.nextSibling);
})();

/* ---------- Time-limited features (e.g. World Rabies Day) ----------
   Any element with data-show-until="YYYY-MM-DD" hides itself after that date. */
(function () {
  var today = new Date(); today.setHours(0, 0, 0, 0);
  document.querySelectorAll('[data-show-until]').forEach(function (el) {
    var p = el.getAttribute('data-show-until').split('-');
    var until = new Date(+p[0], +p[1] - 1, +p[2]);
    if (today > until) el.hidden = true;
  });
})();

/* ---------- Site search ---------- */
(function () {
  var DATA = window.PVO_SEARCH || [];
  var openers = document.querySelectorAll('.search-open');
  if (!openers.length || !DATA.length) return;

  var dlg = document.createElement('dialog');
  dlg.className = 'search-dialog';
  dlg.id = 'siteSearch';
  dlg.setAttribute('aria-label', 'Search this site');
  dlg.innerHTML =
    '<div class="sd-head">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<label class="visually-hidden" for="sdInput">Search this site</label>' +
      '<input id="sdInput" type="search" placeholder="Search services, diseases, forms…" autocomplete="off" aria-controls="sdResults">' +
      '<button type="button" class="sd-close" aria-label="Close search">Esc</button>' +
    '</div>' +
    '<p class="sd-status" id="sdStatus" aria-live="polite"></p>' +
    '<ul class="sd-results" id="sdResults"></ul>' +
    '<div class="sd-suggest"><span>Popular:</span>' +
      ['ASF', 'Rabies', 'Sample collection', 'Office hours', 'Vaccination'].map(function (q) {
        return '<button type="button" data-q="' + q + '">' + q + '</button>';
      }).join('') + '</div>';
  document.body.appendChild(dlg);

  var input = dlg.querySelector('input'), list = dlg.querySelector('.sd-results'),
      status = dlg.querySelector('.sd-status'), suggest = dlg.querySelector('.sd-suggest');

  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'and'); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mark(text, terms) {
    var out = esc(text);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }
  function search(q) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return DATA.map(function (e) {
      var t = norm(e.t), d = norm(e.d), w = norm(e.w + ' ' + e.k), score = 0;
      for (var i = 0; i < terms.length; i++) {
        var term = terms[i], s = 0;
        if (t.indexOf(term) > -1) s += (t.indexOf(term) === 0 ? 6 : 4);
        if (w.indexOf(term) > -1) s += 2;
        if (d.indexOf(term) > -1) s += 1;
        if (!s) return null;           // every word must match somewhere
        score += s;
      }
      return { e: e, score: score };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 12);
  }
  function render() {
    var q = input.value.trim(), terms = norm(q).split(/\s+/).filter(Boolean);
    suggest.hidden = !!q;
    if (!q) { list.innerHTML = ''; status.textContent = ''; return; }
    var res = search(q);
    status.textContent = res.length ? res.length + (res.length === 1 ? ' result' : ' results') : 'No results for “' + q + '”. Try a shorter word, or call (035) 226-3184.';
    list.innerHTML = res.map(function (r) {
      var e = r.e, ext = /^https?:/.test(e.u), file = /\.(pdf|docx?)$/i.test(e.u);
      return '<li><a href="' + e.u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + (file ? ' download' : '') + '>' +
        '<span class="sd-kicker">' + esc(e.k) + (file ? ' · Download PDF' : '') + '</span>' +
        '<span class="sd-title">' + mark(e.t, terms) + '</span>' +
        '<span class="sd-desc">' + mark(e.d, terms) + '</span></a></li>';
    }).join('');
  }
  var opener = null;
  function open(e) {
    opener = document.activeElement;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    input.focus(); input.select();
  }
  openers.forEach(function (b) { b.addEventListener('click', open); });
  input.addEventListener('input', render);
  suggest.addEventListener('click', function (e) {
    var q = e.target.getAttribute('data-q'); if (!q) return;
    input.value = q; render(); input.focus();
  });
  dlg.querySelector('.sd-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { if (opener && opener.focus) opener.focus(); });
  // Result links to the current page (e.g. #asf) should close the dialog
  list.addEventListener('click', function (e) { if (e.target.closest('a')) dlg.close(); });
  // Arrow keys move between input and results; Enter opens the first result
  dlg.addEventListener('keydown', function (e) {
    var links = Array.prototype.slice.call(list.querySelectorAll('a')), i = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (links[i + 1] || links[0] || input).focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (i <= 0 ? input : links[i - 1]).focus(); }
    else if (e.key === 'Enter' && document.activeElement === input && links[0]) { e.preventDefault(); links[0].click(); }
  });
  // Press "/" anywhere (outside a text field) to search
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable && !dlg.open) {
      e.preventDefault(); open();
    }
  });
})();

/* ---------- Forms page: find a form ---------- */
(function () {
  var input = document.getElementById('formsFilter');
  if (!input) return;
  var status = document.getElementById('formsFilterStatus');
  var items = Array.prototype.slice.call(document.querySelectorAll('#resources .form-item'));
  input.addEventListener('input', function () {
    var terms = input.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    items.forEach(function (it) {
      var text = it.textContent.toLowerCase();
      var ok = terms.every(function (t) { return text.indexOf(t) > -1; });
      it.hidden = !ok; if (ok) shown++;
    });
    document.querySelectorAll('#resources .forms-list').forEach(function (list) {
      var any = list.querySelector('.form-item:not([hidden])');
      var title = list.previousElementSibling;
      while (title && !title.classList.contains('forms-group-title')) title = title.previousElementSibling;
      list.hidden = !any;
      if (title) {
        title.hidden = !any;
        var note = title.nextElementSibling;
        if (note && note.classList.contains('forms-group-note')) note.hidden = !any;
      }
    });
    status.textContent = terms.length ? (shown ? shown + ' of ' + items.length + ' forms' : 'No forms match. Try another word, or ask the office for a copy.') : '';
  });
})();

/* ---------- Back to top ---------- */
(function () {
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'to-top'; b.setAttribute('aria-label', 'Back to top'); b.hidden = true;
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
  document.body.appendChild(b);
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { b.hidden = window.scrollY < 700; ticking = false; });
  }, { passive: true });
  b.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    var skip = document.querySelector('.skip-link'); if (skip) skip.focus({ preventScroll: true });
  });
})();

/* ---------- Photo highlights: one cover photo that opens each gallery ----------
   Used by Rabies Awareness Month, Blaides Congress and Livestock Assessment.
   Any section with a .g-cover button and a .g-hide button works the same way. */
(function () {
  var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sections = [];
  document.querySelectorAll('.g-cover').forEach(function (cover) {
    var sec = cover.closest('section');
    var grid = document.getElementById(cover.getAttribute('aria-controls'));
    var hide = sec && sec.querySelector('.g-hide');
    var hint = sec && sec.querySelector('.g-hint');
    if (!sec || !grid || !hide) return;
    var tiles = grid.querySelectorAll('.rm-tile');
    var count = cover.querySelector('.g-count');
    if (count) count.textContent = tiles.length;
    var title = cover.querySelector('.g-cover-title');
    cover.setAttribute('aria-label', (title ? title.textContent + ': ' : '') + 'view all ' + tiles.length + ' photos');

    function collapse() {
      grid.hidden = true; hide.hidden = true; cover.hidden = false;
      cover.setAttribute('aria-expanded', 'false');
      if (hint) hint.textContent = PVO_tr('Select the photo below to see all {n} photos.', tiles.length);
    }
    function expand(focusFirst) {
      grid.hidden = false; hide.hidden = false; cover.hidden = true;
      cover.setAttribute('aria-expanded', 'true');
      if (hint) hint.textContent = PVO_tr('Select a photo to view it larger.');
      if (focusFirst && tiles[0]) tiles[0].focus({ preventScroll: true });
    }
    cover.addEventListener('click', function () { expand(true); });
    hide.addEventListener('click', function () {
      collapse();
      cover.focus({ preventScroll: true });
      sec.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
    });
    collapse();
    document.addEventListener('pvo:lang', function () { if (hint) hint.textContent = grid.hidden ? PVO_tr('Select the photo below to see all {n} photos.', tiles.length) : PVO_tr('Select a photo to view it larger.'); });
    sections.push({ id: sec.id, expand: expand });
  });

  // Links such as "See activity photos" (#rabies-month) open that gallery
  function openFromHash() {
    var id = decodeURIComponent((location.hash || '').slice(1));
    sections.forEach(function (x) { if (x.id === id) x.expand(false); });
  }
  window.addEventListener('hashchange', openFromHash);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname) return;
    sections.forEach(function (x) { if ('#' + x.id === url.hash) x.expand(false); });
  });
  openFromHash();
})();

/* ---------- Organization chart: open everything when printing ---------- */
(function () {
  var reopen = [];
  window.addEventListener('beforeprint', function () {
    reopen = Array.prototype.slice.call(document.querySelectorAll('#org-chart, #org-chart details')).filter(function (d) { return !d.open; });
    reopen.forEach(function (d) { d.open = true; });
  });
  window.addEventListener('afterprint', function () { reopen.forEach(function (d) { d.open = false; }); reopen = []; });
})();

/* ---------- Services: Citizen's Charter tiles, filter and procedure pop-up ----------
   Each service is an <article class="cc-item"> in services.html. The tile opens a
   pop-up showing the hidden .cc-proc block inside the same article. */
(function () {
  var dlg = document.getElementById('ccDialog');
  var items = Array.prototype.slice.call(document.querySelectorAll('.cc-item'));
  if (!dlg || !items.length) return;
  var body = dlg.querySelector('.cc-dialog-body'), iconSlot = dlg.querySelector('.cc-dialog-icon');
  var opener = null;
  function frag(h) {
    if (window.PVO_FRAG) return window.PVO_FRAG(h);
    return decodeURIComponent(((h === undefined ? location.hash : h) || '').replace(/^#/, ''));
  }
  function open(item, from) {
    var grp = item.closest('details'); if (grp && !grp.open) grp.open = true;
    var proc = item.querySelector('.cc-proc');
    body.innerHTML = proc.innerHTML;
    var t = body.querySelector('.cc-title');
    if (t) t.id = 'ccDialogTitle';
    iconSlot.innerHTML = item.querySelector('.cc-icon-wrap').innerHTML;
    var accent = getComputedStyle(item.closest('.cc-group')).getPropertyValue('--accent');
    dlg.style.setProperty('--dlg-accent', accent);
    opener = from || item.querySelector('.cc-tile');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    body.scrollTop = 0;
    dlg.querySelector('.cc-close').focus();
  }
  items.forEach(function (item) {
    var tile = item.querySelector('.cc-tile');
    tile.addEventListener('click', function () { open(item, tile); });
  });
  dlg.querySelector('.cc-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
    if (e.target.closest && e.target.closest('.cc-dialog-body a')) dlg.close();
  });
  dlg.addEventListener('close', function () { if (opener && opener.focus) opener.focus({ preventScroll: true }); });

  // Links such as services.html#cc-rabies (from site search) open that service
  function openFromHash() {
    var id = frag();
    if (!/^cc-/.test(id)) return;
    var item = document.getElementById(id);
    if (item && item.classList.contains('cc-item') && !dlg.open) {
      setTimeout(function () { open(item, item.querySelector('.cc-tile')); }, 60);
    }
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  // Find a service + audience chips
  var input = document.getElementById('ccFilter'), status = document.getElementById('ccStatus');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.cc-chip'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.cc-group'));
  var aud = 'all';
  function apply() {
    var terms = (input.value || '').toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    items.forEach(function (it) {
      var okAud = aud === 'all' || (' ' + it.getAttribute('data-aud') + ' ').indexOf(' ' + aud + ' ') > -1;
      var text = it.getAttribute('data-search');
      var okText = terms.every(function (t) { return text.indexOf(t) > -1; });
      it.hidden = !(okAud && okText); if (!it.hidden) shown++;
    });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.cc-item:not([hidden])'); });
    if (!terms.length && aud === 'all') status.textContent = '';
    else status.textContent = shown ? shown + ' of ' + items.length + ' services' : 'No services match. Try another word, or call (035) 226-3184.';
  }
  input.addEventListener('input', apply);
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      aud = c.getAttribute('data-aud');
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      apply();
    });
  });
})();

/* ---------- Services: collapsible sections ---------- */
(function () {
  var groups = Array.prototype.slice.call(document.querySelectorAll('details.cc-group'));
  var btn = document.getElementById('ccAll');
  if (!groups.length || !btn) return;
  function sync() {
    var allOpen = groups.every(function (g) { return g.open || g.hidden; });
    btn.textContent = allOpen ? 'Close all sections' : 'Open all sections';
    btn.setAttribute('aria-pressed', allOpen ? 'true' : 'false');
  }
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-pressed') !== 'true';
    groups.forEach(function (g) { g.open = open; });
    sync();
  });
  groups.forEach(function (g) { g.addEventListener('toggle', sync); });
  // While filtering, open every section that has a match
  var input = document.getElementById('ccFilter');
  function reveal() {
    var filtering = (input && input.value.trim()) || document.querySelector('.cc-chip[aria-pressed="true"]:not([data-aud="all"])');
    if (filtering) groups.forEach(function (g) { if (!g.hidden) g.open = true; });
  }
  if (input) input.addEventListener('input', function () { setTimeout(reveal, 0); });
  Array.prototype.forEach.call(document.querySelectorAll('.cc-chip'), function (c) { c.addEventListener('click', function () { setTimeout(reveal, 0); }); });
  // Print everything
  var reclose = [];
  window.addEventListener('beforeprint', function () {
    reclose = Array.prototype.slice.call(document.querySelectorAll('details.cc-group, details.sec-fold')).filter(function (d) { return !d.open; });
    reclose.forEach(function (d) { d.open = true; });
  });
  window.addEventListener('afterprint', function () { reclose.forEach(function (d) { d.open = false; }); reclose = []; });
  sync();
})();

/* ---------- World Rabies Day "Discover more" toggle ---------- */
(function () {
  var btn = document.querySelector('.wr-more');
  var panel = btn && document.getElementById(btn.getAttribute('aria-controls'));
  if (!btn || !panel) return;
  var label = btn.querySelector('.wr-more-label');
  document.addEventListener('pvo:lang', function () { label.textContent = PVO_tr(btn.getAttribute('aria-expanded') === 'true' ? 'Show less' : 'Discover more'); });
  panel.hidden = true;
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
    label.textContent = PVO_tr(open ? 'Discover more' : 'Show less');
    if (!open) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();

/* ---------- About views: read more, pop-up topic cards, in-place cards, FAQ tabs ---------- */
(function () {
  // Read more fade (only when the text is actually long)
  document.querySelectorAll('[data-more]').forEach(function (sec) {
    var body = sec.querySelector('.rz-more-body'), btn = sec.querySelector('.rz-more-btn');
    if (!body || !btn) return;
    function setup() {
      if (sec.classList.contains('is-ready') || !body.offsetParent) return;
      if (body.scrollHeight <= 300) return;
      sec.classList.add('is-ready'); btn.hidden = false;
    }
    setup();
    document.addEventListener('click', function () { setTimeout(setup, 0); }); // runs again when a hidden view is opened
    document.addEventListener('pvo:lang', function () { btn.querySelector('span').textContent = PVO_tr(sec.classList.contains('is-open') ? 'Show less' : 'Read more'); });
    btn.addEventListener('click', function () {
      var open = !sec.classList.contains('is-open');
      sec.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('span').textContent = PVO_tr(open ? 'Show less' : 'Read more');
      if (!open) sec.scrollIntoView({ block: 'nearest' });
    });
  });

  // Topic cards that open a pop-up window
  document.querySelectorAll('[data-dialog]').forEach(function (btn) {
    var dlg = document.getElementById(btn.getAttribute('data-dialog'));
    if (!dlg || typeof dlg.showModal !== 'function') return;
    btn.addEventListener('click', function () { dlg.showModal(); });
    dlg.querySelector('.rz-dialog-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { btn.focus(); });
  });

  // Topic card that opens in place
  document.querySelectorAll('.rz-inline-btn').forEach(function (btn) {
    var body = document.getElementById(btn.getAttribute('aria-controls'));
    if (!body) return;
    body.hidden = true;
    document.addEventListener('pvo:lang', function () { btn.querySelector('span').textContent = PVO_tr(btn.getAttribute('aria-expanded') === 'true' ? 'Hide details' : 'Show details'); });
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      body.hidden = !open;
      btn.querySelector('span').textContent = PVO_tr(open ? 'Hide details' : 'Show details');
    });
  });

  // FAQ topic tabs
  document.querySelectorAll('.rz-ftabs').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('.rz-ftab'));
    function select(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.classList.toggle('active', on); x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.classList.toggle('active', on);
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (n === null) return;
        e.preventDefault(); var nt = tabs[(n + tabs.length) % tabs.length]; select(nt); nt.focus();
      });
    });
  });
})();
