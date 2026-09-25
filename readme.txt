PVO Negros Oriental website
===========================

Pages
  index.html            Home (banner, hero, animals we care for, links to every page)
  services.html         Services from the Citizen's Charter (tiles + step-by-step pop-ups),
                        service pledge, walk-in steps, feedback & complaints
  about.html            Mandate, mission, vision and core values
  organization.html     Organization chart and sections
  disease-status.html   ASF, avian influenza and rabies reports + exposed-dog guide
  forms.html            Forms and downloads
  contact.html          Contact details, hours and coverage map

Folders
  css/style.css         All styling (shared by every page)
  js/main.js            Dropdown menu, homepage slideshow, tabs and deep links
  images/               Photos, maps, seals and banner
  documents/            Downloadable PDFs

Publishing
  Upload the whole folder, keeping the folder structure, to the web server
  (or to Netlify / GitHub Pages). index.html is the home page.

Updating
  - Replace a photo: overwrite the file in images/ with the same name.
  - Replace a PDF: overwrite the file in documents/ with the same name.
  - Tabs can be linked directly, e.g. disease-status.html#rabies,
    disease-status.html#avian, or organization.html#ext.

Homepage
  - Slideshow: edit the five slides near the top of index.html (look for class="slide").
  - "Latest advisories & updates": edit the list under class="news-list".
    Put the newest item first and keep the date format (e.g. 11 Sep 2026).
  - "PVO in action": swap photos under class="action-grid".
  - Rabies Awareness Month photos: edit the tiles under class="rm-grid"
    (photos are images/rabies-month-*.jpg). Clicking a photo opens it full size.
  - 2025 Blaides Congress photos: tiles under id="blaides-congress"
    (photos are images/blaides-congress-*.jpg).
  - Livestock Assessment photos: tiles under id="livestock-assessment"
    (photos are images/livestock-assessment-*.jpg). The first tile
    (class="rm-feature") shows large.
  - Downloadable forms: files are in documents/forms/. To add one, copy a
    <div class="form-item"> block in forms.html and change the title,
    description, file size and both file names in the Download link.

Site search, alerts and time-limited features
  - Disease alerts strip: edit the ALERTS list in js/main.js (look for
    "Disease alerts strip"). Levels: active (red), clear (green), watch (brown).
  - Search: entries are in js/search-index.js (title, description, link,
    section label, extra keywords). Add an entry when you add a page,
    form or photo section.
  - World Rabies Day feature (index.html, id="world-rabies-day") hides
    after the date in data-show-until. Reuse the same block for future
    observances by changing the text, photo and date.
  - Priority animal diseases cards: index.html, id="priority-diseases".
    Update the "Latest status" lines when new bulletins come out.
  - Photo highlights (Rabies Awareness Month, Blaides Congress, Livestock
    Assessment) each start closed behind one cover photo: the
    <button class="g-cover"> above each gallery in index.html. Change its
    <img> to use a different cover photo. The photo count updates by itself.

Services page (Citizen's Charter)
  - Each service is one <article class="cc-item"> block in services.html, marked
    with a comment "<!-- Service: ... -->". The tile (button) shows the short name,
    total processing time and fee; the hidden <div class="cc-proc"> holds the full
    procedure that opens in the pop-up. Edit both when the Charter changes.
  - data-aud on each article controls the filter chips: public, lgu, staff.
  - Link straight to a service with services.html#cc-<name>, e.g.
    services.html#cc-rabies. Section links: #svc-health, #svc-production,
    #svc-regulation, #svc-extension, #svc-general, #svc-lgu, #svc-admin,
    #walkin, #feedback.
  - Update the matching entries in js/search-index.js if a service is added,
    renamed or removed.
