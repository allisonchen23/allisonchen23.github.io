/* Recipe Studio UI. Depends on RecipeCore (recipe-studio-core.js), marked and DOMPurify. */
(function () {
  'use strict';

  var C = window.RecipeCore;
  var REPO = { owner: 'allisonchen23', name: 'allisonchen23.github.io', dir: 'chia_next_time/_posts' };
  var SITE = 'https://allisonchen.us';
  var AVOCADO = '/assets/images/avocado.png';
  // Your own import helper on Vercel (code in _tools/recipe-import). Tried first;
  // leave empty to skip it. Example: 'https://recipe-import-xyz.vercel.app/api/fetch?url={url}'
  var IMPORT_SERVICE = '';
  // Free public fallbacks, used if your own helper is missing or fails.
  var PROXIES = [
    function (u) { return 'https://corsproxy.io/?url=' + encodeURIComponent(u); },
    function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); }
  ];

  // ---------- tiny utilities ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k in n && typeof attrs[k] !== 'string') n[k] = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    if (text != null) n.textContent = text;
    return n;
  }
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v == null || v === '') window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  function settings() {
    return {
      token: store.get('rs.token') || '',
      branch: store.get('rs.branch') || 'master',
      proxy: store.get('rs.proxy') || ''
    };
  }
  function setStatus(node, msg, kind) {
    node.textContent = msg || '';
    node.classList.toggle('is-error', kind === 'error');
    node.classList.toggle('is-ok', kind === 'ok');
  }
  function b64encode(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decode(b64) {
    var bin = atob(String(b64).replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function jekyllNow() {
    var d = new Date(Date.now() - 5 * 60 * 1000); // a few minutes back so the build never sees a "future" post
    var off = -d.getTimezoneOffset();
    var sign = off >= 0 ? '+' : '-';
    off = Math.abs(off);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' ' + sign + pad(Math.floor(off / 60)) + pad(off % 60);
  }
  function prettyDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    if (!m) return '';
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).replace(/,(?= \w+ \d)/, '');
  }
  function normPermalink(p) {
    var s = C.slugify(String(p || '').replace(/^\/+|\/+$/g, ''));
    return '/' + s + '/';
  }

  // ---------- GitHub ----------
  function gh(path, opts) {
    opts = opts || {};
    var s = settings();
    var headers = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (s.token) headers.Authorization = 'Bearer ' + s.token;
    if (opts.body) headers['Content-Type'] = 'application/json';
    var url = /^https:/.test(path) ? path : 'https://api.github.com/repos/' + REPO.owner + '/' + REPO.name + '/' + path;
    return fetch(url, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: 'no-store' })
      .then(function (res) {
        return res.text().then(function (t) {
          var json = null;
          try { json = t ? JSON.parse(t) : null; } catch (e) { /* not JSON */ }
          return { ok: res.ok, status: res.status, json: json };
        });
      });
  }
  function ghError(res, action) {
    var msg = res.json && res.json.message ? ' (' + res.json.message + ')' : '';
    if (res.status === 401) return 'GitHub rejected your token. Check it in Settings.' + msg;
    if (res.status === 403 && /rate limit/i.test(msg)) return 'GitHub is limiting requests. Add your token in Settings to raise the limit.';
    if (res.status === 403) return 'Your token doesn\'t have permission to ' + action + '. It needs Contents: Read and write.' + msg;
    if (res.status === 404) return 'Not found on GitHub. Check the branch in Settings and that the token can see this repository.' + msg;
    if (res.status === 409 || res.status === 422) return 'This recipe changed on GitHub since you opened it. Reopen it from My recipes and try again.' + msg;
    return 'GitHub error ' + res.status + msg;
  }
  function contentsPath(p) { return 'contents/' + p.split('/').map(encodeURIComponent).join('/'); }

  // ---------- state ----------
  var state = {
    view: null,
    library: [],
    libraryLoaded: false,
    recipe: null,
    baseline: '',
    md: null,              // Markdown edited directly (overrides the editor) or null
    permalinkTouched: false,
    busy: false
  };

  function currentText() { return state.md != null ? state.md : C.renderPost(state.recipe); }
  function isDirty() { return state.recipe && currentText() !== state.baseline; }

  // ---------- views ----------
  function show(view) {
    state.view = view;
    $$('.rs-view').forEach(function (v) { v.hidden = v.id !== 'view-' + view; });
    window.scrollTo(0, 0);
  }
  function go(view) {
    if (state.view === 'editor' && view !== 'editor' && isDirty() && state.recipe.path) {
      return confirmDialog('Leave without saving?', 'Your changes to "' + (state.recipe.title || 'this recipe') + '" haven\'t been published.', 'Leave').then(function (ok) {
        if (ok) { state.recipe = null; go(view); }
      });
    }
    if (view === 'library') { renderLibrary(); if (!state.libraryLoaded) loadLibrary(); }
    if (view === 'new') {
      setStatus($('#rs-import-status'), '');
      setStatus($('#rs-paste-status'), '');
    }
    show(view);
  }

  // ---------- library ----------
  function loadLibrary() {
    var status = $('#rs-lib-status');
    var s = settings();
    setStatus(status, 'Loading recipes from GitHub…');
    $('#rs-lib-sub').textContent = 'Recipes on the "' + s.branch + '" branch of your site.';
    return gh(contentsPath(REPO.dir) + '?ref=' + encodeURIComponent(s.branch)).then(function (res) {
      if (!res.ok) throw new Error(ghError(res, 'read the repository'));
      var files = (res.json || []).filter(function (f) { return f.type === 'file' && /\.(md|markdown)$/i.test(f.name); });
      return Promise.all(files.map(function (f) {
        return gh(contentsPath(f.path) + '?ref=' + encodeURIComponent(s.branch)).then(function (r) {
          if (!r.ok) return null;
          var text = b64decode(r.json.content);
          var fm = C.splitFrontMatter(text);
          var cats = (C.fmGet(fm.lines, 'categories') + ' ' + C.fmGet(fm.lines, 'category')).toLowerCase();
          if (cats.indexOf('recipe') < 0) return null;
          return {
            path: f.path, sha: r.json.sha, text: text,
            title: C.fmGet(fm.lines, 'title') || f.name,
            permalink: C.fmGet(fm.lines, 'permalink'),
            date: C.fmGet(fm.lines, 'date')
          };
        });
      }));
    }).then(function (items) {
      state.library = items.filter(Boolean).sort(function (a, b) { return a.title.localeCompare(b.title); });
      state.libraryLoaded = true;
      setStatus(status, '');
      renderLibrary();
    }).catch(function (err) {
      setStatus(status, err.message || 'Could not load recipes.', 'error');
    });
  }

  function renderLibrary() {
    var list = $('#rs-lib-list');
    list.textContent = '';
    var draft = loadDraft();
    $('#rs-draft-banner').hidden = !draft;
    if (draft) $('#rs-draft-title').textContent = draft.recipe.title || 'Untitled recipe';
    if (state.libraryLoaded && !state.library.length) {
      list.appendChild(el('li', { class: 'rs-empty' }, 'No recipes yet. Start one with "+ New recipe".'));
    }
    state.library.forEach(function (item) {
      var li = el('li', { class: 'rs-lib-item' });
      var main = el('div', { class: 'rs-lib-main', tabindex: '0', role: 'button' });
      main.appendChild(el('div', { class: 'rs-lib-title' }, item.title));
      main.appendChild(el('div', { class: 'rs-lib-meta' }, (item.permalink ? 'allisonchen.us' + item.permalink : item.path) + (item.date ? '  ·  ' + prettyDate(item.date) : '')));
      main.addEventListener('click', function () { openExisting(item); });
      main.addEventListener('keydown', function (e) { if (e.key === 'Enter') openExisting(item); });
      var actions = el('div', { class: 'rs-lib-actions' });
      var edit = el('button', { class: 'rs-btn rs-btn-small rs-btn-soft', type: 'button' }, 'Edit');
      edit.addEventListener('click', function () { openExisting(item); });
      actions.appendChild(edit);
      if (item.permalink) {
        actions.appendChild(el('a', { class: 'rs-btn rs-btn-small rs-btn-ghost', href: SITE + item.permalink, target: '_blank', rel: 'noopener' }, 'View'));
      }
      var del = el('button', { class: 'rs-btn rs-btn-small rs-btn-danger-ghost', type: 'button' }, 'Delete');
      del.addEventListener('click', function () { deleteRecipe(item); });
      actions.appendChild(del);
      li.appendChild(main);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function openExisting(item) {
    var r = C.parsePost(item.text);
    r.path = item.path;
    r.sha = item.sha;
    // compare against the editor's own rendering, so only real edits count as changes
    openEditor(r, C.renderPost(r));
  }

  // ---------- drafts (new, unpublished recipes) ----------
  function loadDraft() {
    var raw = store.get('rs.draft');
    if (!raw) return null;
    try { var d = JSON.parse(raw); return d && d.recipe ? d : null; } catch (e) { return null; }
  }
  function saveDraft() {
    if (!state.recipe || state.recipe.path) return;
    var r = state.recipe;
    var empty = !r.title.trim() && state.md == null &&
      r.ingredients.concat(r.instructions).every(function (it) { return !String(it.text || '').trim(); });
    if (empty) return;
    store.set('rs.draft', JSON.stringify({ recipe: state.recipe, md: state.md, permalinkTouched: state.permalinkTouched, savedAt: Date.now() }));
  }
  function clearDraft() { store.set('rs.draft', null); }

  // ---------- editor ----------
  function startNew(recipe) {
    recipe.path = null;
    recipe.sha = null;
    recipe.date = jekyllNow();
    recipe.permalink = recipe.title ? normPermalink(recipe.title) : '';
    state.permalinkTouched = false;
    openEditor(recipe, '');
  }

  function openEditor(recipe, baseline) {
    state.recipe = recipe;
    state.baseline = baseline;
    state.md = null;
    if (recipe.path) state.permalinkTouched = true;
    $('#rs-publish-banner').hidden = true;
    fillEditor();
    setTab(recipe.structured ? 'edit' : 'markdown');
    show('editor');
    growAll();
    if (!recipe.title) setTimeout(function () { $('#rs-title').focus(); }, 30);
  }

  function fillEditor() {
    var r = state.recipe;
    $('#rs-title').value = r.title || '';
    $$('[data-meta]').forEach(function (inp) { inp.value = r.meta[inp.getAttribute('data-meta')] || ''; });
    $('#rs-after').value = r.after || '';
    $('#rs-permalink').value = r.permalink || '';
    $('#rs-date').value = r.date || '';
    renderAvocados();
    renderList('ingredients');
    renderList('instructions');
    $('#rs-delete').hidden = !r.path;
    $('#rs-publish').textContent = r.path ? 'Save changes' : 'Publish';
    $('#rs-md-banner').hidden = state.md == null;
    updatePathHint();
    $$('.rs-pane-edit input, .rs-pane-edit textarea, .rs-pane-edit button').forEach(function (n) { n.disabled = !r.structured; });
    changed(true);
  }

  function updatePathHint() {
    var r = state.recipe;
    var hint = $('#rs-path-hint');
    if (r.path) hint.textContent = 'Saved in ' + r.path;
    else hint.textContent = 'Will be saved in ' + REPO.dir + '/' + newFileName(r);
  }
  function newFileName(r) {
    var d = /^(\d{4}-\d{2}-\d{2})/.exec(r.date || jekyllNow());
    var slug = C.slugify((r.permalink || '').replace(/\//g, ' ') || r.title);
    return (d ? d[1] : jekyllNow().slice(0, 10)) + '-' + slug + '.md';
  }

  var previewTimer = null;
  function changed(immediate) {
    if (!state.recipe) return;
    var dirty = isDirty();
    var st = $('#rs-save-state');
    if (!state.recipe.path) st.textContent = 'Not published yet';
    else st.textContent = dirty ? 'Unsaved changes' : 'Up to date';
    saveDraft(); // cheap, and must not be lost if the tab closes right away
    clearTimeout(previewTimer);
    previewTimer = setTimeout(function () {
      renderPreview();
      if ($('.rs-workspace').getAttribute('data-tab') === 'markdown' && state.md == null) $('#rs-markdown').value = currentText();
    }, immediate ? 0 : 180);
  }

  function renderPreview() {
    var text = currentText();
    var fm = C.splitFrontMatter(text);
    var box = $('#rs-preview');
    box.textContent = '';
    box.appendChild(el('h2', { class: 'blogpost title' }, C.fmGet(fm.lines, 'title') || 'Untitled recipe'));
    var date = prettyDate(C.fmGet(fm.lines, 'date'));
    if (date) box.appendChild(el('h4', { class: 'date' }, date));
    var body = el('div', { class: 'rs-preview-body' });
    var html = window.marked.parse(C.previewMarkdown(fm.body, AVOCADO), { gfm: true });
    body.innerHTML = window.DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
    $$('a', body).forEach(function (a) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); });
    box.appendChild(body);
  }

  // difficulty
  function renderAvocados() {
    var wrap = $('#rs-avocados');
    wrap.textContent = '';
    var level = state.recipe.meta.difficulty || 0;
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        var b = el('button', { type: 'button', class: 'rs-avocado' + (n <= level ? ' is-on' : ''), role: 'radio', 'aria-checked': String(n === level), 'aria-label': n + ' out of 5', title: n + ' out of 5' });
        b.appendChild(el('img', { src: AVOCADO, alt: '' }));
        b.addEventListener('click', function () {
          state.recipe.meta.difficulty = state.recipe.meta.difficulty === n ? null : n;
          renderAvocados();
          changed();
        });
        wrap.appendChild(b);
      })(i);
    }
  }

  // ---------- ingredient / step lists ----------
  var defaultMarker = { ingredients: 'bullet', instructions: 'number' };
  function newItem(list, type) {
    if (type === 'heading') return { type: 'heading', level: 4, text: '' };
    if (type === 'note') return { type: 'note', text: '' };
    return { type: 'item', marker: defaultMarker[list], indent: '', text: '', extra: [] };
  }
  function cleanPasted(line) {
    return line.replace(/^\s*(?:[*•●+-]|\d+[.)]|step\s*\d+[.:)]?)\s*/i, '').trim();
  }
  function autoGrow(t) {
    if (!t.offsetParent) return; // hidden: measure later
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 'px';
  }
  function growAll() { $$('.rs-item-input').forEach(autoGrow); }

  var drag = null;
  function renderList(list, focusIndex, caret) {
    var ol = $('#rs-' + list);
    var items = state.recipe[list];
    ol.textContent = '';
    var counters = {};
    items.forEach(function (it, idx) {
      var li = el('li', { class: 'rs-item rs-item-' + it.type + (it.indent ? ' rs-item-sub' : '') });
      li.dataset.index = idx;

      var handle = el('span', { class: 'rs-handle', draggable: 'true', title: 'Drag to reorder (or Alt + arrow keys)', 'aria-hidden': 'true' }, '⡇⡇');
      handle.addEventListener('dragstart', function (e) {
        drag = { list: list, from: idx };
        li.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(idx)); } catch (err) { /* old browsers */ }
        try { e.dataTransfer.setDragImage(li, 20, 20); } catch (err) { /* optional */ }
      });
      handle.addEventListener('dragend', function () { drag = null; renderList(list); });
      li.addEventListener('dragover', function (e) {
        if (!drag || drag.list !== list) return;
        e.preventDefault();
        var r = li.getBoundingClientRect();
        var after = e.clientY > r.top + r.height / 2;
        $$('.rs-item', ol).forEach(function (n) { n.classList.remove('is-drop-before', 'is-drop-after'); });
        li.classList.add(after ? 'is-drop-after' : 'is-drop-before');
      });
      li.addEventListener('drop', function (e) {
        if (!drag || drag.list !== list) return;
        e.preventDefault();
        var r = li.getBoundingClientRect();
        var to = idx + (e.clientY > r.top + r.height / 2 ? 1 : 0);
        moveItem(list, drag.from, to);
        drag = null;
      });

      var marker = el('span', { class: 'rs-marker' });
      if (it.type === 'heading') marker.textContent = 'SECTION';
      else if (it.type === 'note') marker.textContent = 'NOTE';
      else if (it.marker === 'number') {
        counters[it.indent] = (counters[it.indent] || 0) + 1;
        marker.textContent = String(counters[it.indent]);
        marker.classList.add('rs-marker-num');
      } else marker.classList.add('rs-marker-dot');
      if (it.type !== 'item') counters = {};
      if (it.type === 'item' && it.marker !== 'number' && !it.indent) counters = {};
      if (it.type === 'heading' || it.type === 'note') { marker.style.flexBasis = '58px'; }

      var placeholder = it.type === 'heading' ? 'Section name (e.g. Frosting)' :
        it.type === 'note' ? 'A note or sub-heading (e.g. "Dry ingredients:")' :
        list === 'ingredients' ? 'e.g. 2 cups flour' : 'Describe this step';
      var input = el('textarea', { class: 'rs-item-input', rows: '1', placeholder: placeholder, 'aria-label': placeholder });
      input.value = it.text;
      input.addEventListener('input', function () { it.text = input.value; autoGrow(input); changed(); });
      input.addEventListener('keydown', function (e) { itemKeys(e, list, idx, input); });
      input.addEventListener('paste', function (e) { itemPaste(e, list, idx, input); });

      var tools = el('span', { class: 'rs-item-tools' });
      if (it.type === 'item') {
        var ind = el('button', { type: 'button', class: 'rs-icon-btn', title: it.indent ? 'Outdent (Shift+Tab)' : 'Indent as a sub-item (Tab)', 'aria-label': it.indent ? 'Outdent' : 'Indent' }, it.indent ? '⇤' : '⇥');
        ind.addEventListener('click', function () { toggleIndent(list, idx); });
        tools.appendChild(ind);
      }
      var del = el('button', { type: 'button', class: 'rs-icon-btn rs-del', title: 'Remove', 'aria-label': 'Remove' }, '×');
      del.addEventListener('click', function () { removeItem(list, idx, false); });
      tools.appendChild(del);

      li.appendChild(handle);
      li.appendChild(marker);
      li.appendChild(input);
      li.appendChild(tools);
      if (it.extra && it.extra.length) li.title = 'Extra formatting under this line is kept as-is.';
      ol.appendChild(li);
    });
    $$('.rs-item-input', ol).forEach(autoGrow);
    if (focusIndex != null) {
      var target = $$('.rs-item-input', ol)[Math.max(0, Math.min(focusIndex, items.length - 1))];
      if (target) {
        target.focus();
        var pos = caret == null ? target.value.length : caret;
        target.setSelectionRange(pos, pos);
      }
    }
  }

  function itemKeys(e, list, idx, input) {
    var items = state.recipe[list];
    var it = items[idx];
    if (e.key === 'Enter' && !e.shiftKey && (it.type !== 'note' || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      var ni = newItem(list, 'item');
      if (it.type === 'item') { ni.marker = it.marker; ni.indent = it.indent; }
      // split the text at the caret, like a normal list editor
      var pos = input.selectionStart;
      if (it.type === 'item' && pos < input.value.length) {
        ni.text = input.value.slice(pos).trim();
        it.text = input.value.slice(0, pos).trim();
      }
      items.splice(idx + 1, 0, ni);
      renderList(list, idx + 1, 0);
      changed();
    } else if (e.key === 'Backspace' && input.value === '' && items.length > 1) {
      e.preventDefault();
      removeItem(list, idx, true);
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      var to = e.key === 'ArrowUp' ? idx - 1 : idx + 2;
      if (to < 0 || to > items.length) return;
      moveItem(list, idx, to, true);
    } else if (e.key === 'Tab' && it.type === 'item') {
      if ((e.shiftKey && it.indent) || (!e.shiftKey && !it.indent)) {
        e.preventDefault();
        toggleIndent(list, idx);
      }
    }
  }

  function itemPaste(e, list, idx, input) {
    var text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text || text.indexOf('\n') < 0 || state.recipe[list][idx].type === 'note') return;
    e.preventDefault();
    var lines = text.split(/\r?\n/).map(cleanPasted).filter(Boolean);
    if (!lines.length) return;
    var items = state.recipe[list];
    var it = items[idx];
    var before = input.value.slice(0, input.selectionStart);
    var after = input.value.slice(input.selectionEnd);
    it.text = (before + lines[0]).trim();
    var extra = lines.slice(1).map(function (l) {
      var n = newItem(list, 'item');
      if (it.type === 'item') { n.marker = it.marker; n.indent = it.indent; }
      n.text = l;
      return n;
    });
    if (extra.length) extra[extra.length - 1].text += after;
    else it.text += after;
    Array.prototype.splice.apply(items, [idx + 1, 0].concat(extra));
    renderList(list, idx + extra.length);
    changed();
  }

  function moveItem(list, from, to, keepFocus) {
    var items = state.recipe[list];
    if (to > from) to--;
    if (to === from) { renderList(list); return; }
    var it = items.splice(from, 1)[0];
    items.splice(to, 0, it);
    renderList(list, keepFocus ? to : null);
    changed();
  }
  function removeItem(list, idx, focusPrev) {
    var items = state.recipe[list];
    items.splice(idx, 1);
    if (!items.length) items.push(newItem(list, 'item'));
    renderList(list, focusPrev ? Math.max(0, idx - 1) : null);
    changed();
  }
  function toggleIndent(list, idx) {
    var it = state.recipe[list][idx];
    it.indent = it.indent ? '' : '    ';
    renderList(list, idx);
    changed();
  }

  // ---------- tabs & markdown ----------
  function setTab(tab) {
    $('.rs-workspace').setAttribute('data-tab', tab);
    $$('.rs-tab').forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === tab)); });
    if (tab === 'markdown') {
      var ta = $('#rs-markdown');
      ta.value = currentText();
    }
    if (tab === 'preview') renderPreview();
    if (tab === 'edit') growAll();
  }

  // ---------- importing ----------
  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('timed out')); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }
  function fetchText(url) {
    return withTimeout(fetch(url, { credentials: 'omit' }), 15000).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(function (t) {
      if (!t || t.length < 200) throw new Error('empty page');
      return t;
    });
  }
  function fetchPage(url) {
    var custom = settings().proxy;
    var attempts = custom
      ? [function () { return fetchText(custom.indexOf('{url}') >= 0 ? custom.replace('{url}', encodeURIComponent(url)) : custom + encodeURIComponent(url)); }]
      : (IMPORT_SERVICE ? [function () { return fetchText(IMPORT_SERVICE.replace('{url}', encodeURIComponent(url))); }] : [])
          .concat([function () { return fetchText(url); }])
          .concat(PROXIES.map(function (p) { return function () { return fetchText(p(url)); }; }));
    var i = 0;
    function next(lastErr) {
      if (i >= attempts.length) return Promise.reject(lastErr || new Error('could not load the page'));
      var attempt = attempts[i++];
      return attempt().catch(next);
    }
    return next();
  }

  function importUrl(input) {
    var status = $('#rs-import-status');
    var btn = $('#rs-import-btn');
    var target = C.unwrapCookedUrl(input);
    var parser = new DOMParser();
    setStatus(status, target.viaCooked && !target.cookedPage ? 'Found the original recipe behind your Cooked link. Importing…' : 'Importing…');
    btn.disabled = true;
    return fetchPage(target.url).then(function (html) {
      var recipe = C.recipeFromHtml(html, target.url, parser);
      if (recipe || !target.cookedPage) return recipe;
      // A cooked.wiki page without the original address in its link: look for one on the page.
      var doc = parser.parseFromString(html, 'text/html');
      var links = $$('link[rel="canonical"], meta[property="og:url"], a[href^="http"]', doc).map(function (n) {
        return n.getAttribute('href') || n.getAttribute('content');
      }).filter(function (h) { return h && !/cooked\.wiki/i.test(h); });
      if (!links.length) return null;
      return fetchPage(links[0]).then(function (h2) { return C.recipeFromHtml(h2, links[0], parser); });
    }).then(function (recipe) {
      btn.disabled = false;
      if (!recipe) {
        setStatus(status, 'I couldn\'t find a recipe on that page. Try "Paste recipe text" below instead.', 'error');
        return;
      }
      setStatus(status, '');
      $('#rs-import-url').value = '';
      startNew(recipe);
    }).catch(function () {
      btn.disabled = false;
      setStatus(status, 'That site couldn\'t be reached or blocked the import. Copy the recipe and use "Paste recipe text" below instead.', 'error');
    });
  }

  // ---------- publish & delete ----------
  function publish() {
    var s = settings();
    var r = state.recipe;
    var status = $('#rs-publish-banner');
    if (!s.token) { openSettings('Add your GitHub token to publish.'); return; }
    if (state.md == null) {
      if (!r.title.trim()) { $('#rs-title').focus(); flash('Give your recipe a title first.'); return; }
      if (!r.permalink) r.permalink = normPermalink(r.title);
      if (!r.date) r.date = jekyllNow();
    }
    var text = currentText();
    var fm = C.splitFrontMatter(text);
    var title = C.fmGet(fm.lines, 'title') || 'recipe';
    var permalink = C.fmGet(fm.lines, 'permalink');
    var isNew = !r.path;

    // don't clash with another recipe's address
    var clash = state.library.filter(function (x) { return x.permalink === permalink && x.path !== r.path; })[0];
    if (clash) {
      flash('Another recipe ("' + clash.title + '") already uses the address ' + permalink + '. Change it under Page settings.');
      $('.rs-advanced').open = true;
      return;
    }

    var path = r.path || REPO.dir + '/' + newFileName(r);
    var btn = $('#rs-publish');
    btn.disabled = true;
    btn.textContent = isNew ? 'Publishing…' : 'Saving…';

    var ready = isNew
      ? gh(contentsPath(path) + '?ref=' + encodeURIComponent(s.branch)).then(function (res) {
          if (res.ok) path = path.replace(/\.md$/, '-' + Date.now().toString(36).slice(-4) + '.md');
        })
      : Promise.resolve();

    ready.then(function () {
      var body = { message: (isNew ? 'Add recipe: ' : 'Update recipe: ') + title + ' (via Recipe Studio)', content: b64encode(text), branch: s.branch };
      if (r.sha) body.sha = r.sha;
      return gh(contentsPath(path), { method: 'PUT', body: body });
    }).then(function (res) {
      btn.disabled = false;
      if (!res.ok) {
        btn.textContent = isNew ? 'Publish' : 'Save changes';
        flash(ghError(res, 'publish'));
        return;
      }
      var saved = C.parsePost(text);
      saved.path = path;
      saved.sha = res.json.content.sha;
      if (isNew) clearDraft();
      // keep the library list in sync without reloading everything
      state.library = state.library.filter(function (x) { return x.path !== path; });
      state.library.push({ path: path, sha: saved.sha, text: text, title: title, permalink: permalink, date: C.fmGet(fm.lines, 'date') });
      state.library.sort(function (a, b) { return a.title.localeCompare(b.title); });
      openEditor(saved, C.renderPost(saved));
      status.textContent = '';
      if (s.branch === 'master' || s.branch === 'main') {
        status.appendChild(document.createTextNode((isNew ? 'Published! ' : 'Saved! ') + 'Your site usually updates within a minute or two: '));
        status.appendChild(el('a', { href: SITE + permalink, target: '_blank', rel: 'noopener' }, 'allisonchen.us' + permalink));
      } else {
        status.appendChild(document.createTextNode('Saved to the "' + s.branch + '" branch. It won\'t show on your live site until that branch is merged.'));
      }
      status.classList.add('rs-banner-ok');
      status.hidden = false;
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = isNew ? 'Publish' : 'Save changes';
      flash('Couldn\'t reach GitHub. Check your connection and try again.');
    });
  }

  function deleteRecipe(item) {
    var s = settings();
    if (!s.token) { openSettings('Add your GitHub token to delete recipes.'); return; }
    confirmDialog('Delete "' + item.title + '"?', 'It will be removed from your website. You can still recover it from your GitHub history.', 'Delete').then(function (ok) {
      if (!ok) return;
      var status = state.view === 'library' ? $('#rs-lib-status') : $('#rs-save-state');
      setStatus(status, 'Deleting…');
      gh(contentsPath(item.path), { method: 'DELETE', body: { message: 'Delete recipe: ' + item.title + ' (via Recipe Studio)', sha: item.sha, branch: s.branch } }).then(function (res) {
        if (!res.ok) { setStatus(status, ghError(res, 'delete'), 'error'); if (state.view === 'editor') flash(ghError(res, 'delete')); return; }
        state.library = state.library.filter(function (x) { return x.path !== item.path; });
        state.recipe = null;
        go('library');
        setStatus($('#rs-lib-status'), 'Deleted "' + item.title + '". Your site will update within a minute or two.', 'ok');
      }).catch(function () { setStatus(status, 'Couldn\'t reach GitHub. Try again.', 'error'); });
    });
  }

  function flash(msg) {
    var b = $('#rs-publish-banner');
    b.classList.remove('rs-banner-ok');
    b.textContent = msg;
    b.hidden = false;
  }

  // ---------- dialogs ----------
  function confirmDialog(title, text, yesLabel) {
    var d = $('#rs-confirm');
    $('#rs-confirm-title').textContent = title;
    $('#rs-confirm-text').textContent = text;
    $('#rs-confirm-yes').textContent = yesLabel || 'OK';
    d.returnValue = '';
    d.showModal();
    return new Promise(function (resolve) {
      d.addEventListener('close', function onClose() {
        d.removeEventListener('close', onClose);
        resolve(d.returnValue === 'yes');
      });
    });
  }

  function openSettings(message) {
    var s = settings();
    $('#rs-token').value = s.token;
    $('#rs-branch').value = s.branch === 'master' ? '' : s.branch;
    $('#rs-proxy').value = s.proxy;
    setStatus($('#rs-token-status'), message || '', message ? 'error' : null);
    $('#rs-settings').returnValue = '';
    $('#rs-settings').showModal();
  }
  function refreshConnDot() { $('#rs-conn-dot').classList.toggle('is-on', !!settings().token); }

  function testToken() {
    var status = $('#rs-token-status');
    var token = $('#rs-token').value.trim();
    if (!token) { setStatus(status, 'Paste a token first.', 'error'); return; }
    setStatus(status, 'Checking…');
    var headers = { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + token };
    fetch('https://api.github.com/repos/' + REPO.owner + '/' + REPO.name + '/' + contentsPath(REPO.dir), { headers: headers, cache: 'no-store' }).then(function (res) {
      if (res.status === 401) throw new Error('GitHub didn\'t accept that token. Check you copied all of it.');
      if (!res.ok) throw new Error('The token works, but can\'t see allisonchen23.github.io. Give it access to that repository.');
      setStatus(status, 'Connected. The token can read your site. Publishing also needs Contents set to "Read and write".', 'ok');
    }).catch(function (e) { setStatus(status, e.message || 'Couldn\'t reach GitHub.', 'error'); });
  }

  // ---------- wire up ----------
  function init() {
    $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-go')); }); });
    $('#rs-refresh').addEventListener('click', function () { state.libraryLoaded = false; loadLibrary(); });
    $('#rs-open-settings').addEventListener('click', function () { openSettings(); });
    $('#rs-test-token').addEventListener('click', testToken);
    $('#rs-forget-token').addEventListener('click', function () {
      $('#rs-token').value = '';
      store.set('rs.token', null);
      refreshConnDot();
      setStatus($('#rs-token-status'), 'Token removed from this browser.', 'ok');
    });
    $('#rs-settings').addEventListener('close', function () {
      if ($('#rs-settings').returnValue !== 'save') return;
      var before = settings().branch;
      store.set('rs.token', $('#rs-token').value.trim());
      store.set('rs.branch', $('#rs-branch').value.trim() || null);
      store.set('rs.proxy', $('#rs-proxy').value.trim());
      refreshConnDot();
      if (settings().branch !== before) { state.libraryLoaded = false; if (state.view === 'library') loadLibrary(); }
    });

    // draft banner
    $('#rs-draft-continue').addEventListener('click', function () {
      var d = loadDraft();
      if (!d) return;
      state.permalinkTouched = !!d.permalinkTouched;
      openEditor(d.recipe, '');
      if (d.md != null) { state.md = d.md; $('#rs-md-banner').hidden = false; }
    });
    $('#rs-draft-discard').addEventListener('click', function () {
      confirmDialog('Discard this draft?', 'The unpublished recipe "' + ((loadDraft() || {}).recipe || {}).title + '" will be thrown away.', 'Discard').then(function (ok) {
        if (ok) { clearDraft(); renderLibrary(); }
      });
    });

    // new recipe
    $('#rs-import-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('#rs-import-url').value.trim();
      if (!v) { setStatus($('#rs-import-status'), 'Paste a recipe link first.', 'error'); return; }
      importUrl(v);
    });
    $('#rs-paste-go').addEventListener('click', function () {
      var r = C.recipeFromText($('#rs-paste-text').value);
      if (!r) { setStatus($('#rs-paste-status'), 'I need a line that says "Ingredients" and one that says "Instructions" (or "Directions"/"Method").', 'error'); return; }
      $('#rs-paste-text').value = '';
      startNew(r);
    });
    $('#rs-start-blank').addEventListener('click', function () { startNew(C.emptyRecipe()); });

    // editor fields
    $('#rs-title').addEventListener('input', function (e) {
      state.recipe.title = e.target.value;
      if (!state.permalinkTouched) {
        state.recipe.permalink = e.target.value.trim() ? normPermalink(e.target.value) : '';
        $('#rs-permalink').value = state.recipe.permalink;
        updatePathHint();
      }
      changed();
    });
    $$('[data-meta]').forEach(function (inp) {
      inp.addEventListener('input', function () { state.recipe.meta[inp.getAttribute('data-meta')] = inp.value; changed(); });
    });
    $('#rs-after').addEventListener('input', function (e) { state.recipe.after = e.target.value; changed(); });
    $('#rs-permalink').addEventListener('input', function (e) { state.permalinkTouched = true; state.recipe.permalink = e.target.value.trim(); updatePathHint(); changed(); });
    $('#rs-permalink').addEventListener('change', function (e) {
      if (!e.target.value.trim()) return;
      state.recipe.permalink = normPermalink(e.target.value);
      e.target.value = state.recipe.permalink;
      updatePathHint();
      changed();
    });
    $('#rs-date').addEventListener('input', function (e) { state.recipe.date = e.target.value.trim(); updatePathHint(); changed(); });
    $$('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        var parts = b.getAttribute('data-add').split(':');
        var items = state.recipe[parts[0]];
        items.push(newItem(parts[0], parts[1]));
        renderList(parts[0], items.length - 1);
        changed();
      });
    });
    $$('.rs-tab').forEach(function (t) { t.addEventListener('click', function () { setTab(t.getAttribute('data-tab')); }); });
    $('#rs-markdown').addEventListener('input', function (e) {
      state.md = e.target.value;
      $('#rs-md-banner').hidden = false;
      changed();
    });
    $('#rs-md-apply').addEventListener('click', function () {
      var r = C.parsePost(state.md);
      r.path = state.recipe.path;
      r.sha = state.recipe.sha;
      var base = state.baseline;
      state.recipe = r;
      state.md = null;
      state.baseline = base;
      fillEditor();
      setTab(r.structured ? 'edit' : 'markdown');
      if (!r.structured) flash('That Markdown doesn\'t have "### Ingredients" and "### Instructions" headings, so keep editing it here.');
    });
    $('#rs-md-discard').addEventListener('click', function () {
      state.md = null;
      $('#rs-md-banner').hidden = true;
      $('#rs-markdown').value = currentText();
      changed(true);
    });
    $('#rs-publish').addEventListener('click', publish);
    $('#rs-delete').addEventListener('click', function () {
      var r = state.recipe;
      deleteRecipe({ path: r.path, sha: r.sha, title: r.title || 'this recipe' });
    });

    window.addEventListener('beforeunload', function (e) {
      if (state.view === 'editor' && state.recipe && state.recipe.path && isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(growAll, 120); });

    refreshConnDot();
    go('library');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
