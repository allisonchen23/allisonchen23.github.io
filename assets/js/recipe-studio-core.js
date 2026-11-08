/*
 * Recipe Studio core: reads and writes Chia Next Time recipe posts, and turns
 * imported recipes (schema.org JSON-LD, microdata or pasted text) into the same
 * structure. No DOM or network code lives here except where a DOMParser is
 * passed in, so the parser can be tested on its own.
 */
(function (root) {
  'use strict';

  // ---------- small helpers ----------
  var DIFFICULTY_RE = /^\{%\s*include\s+difficulty\.html\s+difficulty_level\s*=\s*(\d+)\s*%\}\s*$/;
  var META_RES = [
    ['prep', /^Prep(?:aration)? Time:\s*(.*?)\s*$/i, 'Prep Time: '],
    ['cook', /^Cook(?:ing)? Time:\s*(.*?)\s*$/i, 'Cook Time: '],
    ['time', /^(?:Total )?Time:\s*(.*?)\s*$/i, 'Time: '],
    ['serves', /^(?:Serves|Servings|Yield):\s*(.*?)\s*$/i, 'Serves: ']
  ];
  var SOURCE_RE = /^\*?(?:Recipe )?(?:adapted|inspired|modified) from:?\s+\[(.+?)\]\((\S+?)\)\.?\*?\s*$/i;
  var ING_HEAD_RE = /^#{2,4}\s*Ingredients\s*:?\s*$/i;
  var INST_HEAD_RE = /^#{2,4}\s*(?:Instructions|Directions|Method|Steps)\s*:?\s*$/i;

  function rtrim(s) { return s.replace(/\s+$/, ''); }

  function slugify(s) {
    return String(s || '')
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'recipe';
  }

  /* Keep imported text from being read as Liquid by Jekyll. */
  function deLiquid(s) {
    return String(s || '').replace(/\{\{/g, '{ {').replace(/\{%/g, '{ %');
  }

  function yamlString(v) {
    return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  function yamlUnquote(v) {
    v = String(v || '').trim();
    if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') {
      return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") {
      return v.slice(1, -1).replace(/''/g, "'");
    }
    return v;
  }

  // ---------- front matter ----------
  function splitFrontMatter(text) {
    text = String(text || '').replace(/\r\n/g, '\n');
    var m = /^---\n([\s\S]*?)\n---[ \t]*\n?/.exec(text);
    if (!m) return { lines: [], body: text };
    return { lines: m[1].split('\n'), body: text.slice(m[0].length) };
  }
  function fmGet(lines, key) {
    var re = new RegExp('^' + key + '\\s*:\\s*(.*)$');
    for (var i = 0; i < lines.length; i++) {
      var m = re.exec(lines[i]);
      if (m) return yamlUnquote(m[1]);
    }
    return '';
  }
  function fmSet(lines, key, value) {
    var re = new RegExp('^' + key + '\\s*:');
    var line = key + ': ' + value;
    for (var i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) { lines[i] = line; return lines; }
    }
    lines.push(line);
    return lines;
  }

  // ---------- body: ingredients / instructions blocks ----------
  function parseItems(lines) {
    var items = [];
    var gap = true; // a blank line came before the current line
    lines.forEach(function (raw) {
      var line = rtrim(raw);
      var m;
      var prev = items[items.length - 1];
      if (line === '') { gap = true; return; }
      if ((m = /^(#{4,6})\s+(.*)$/.exec(line))) {
        items.push({ type: 'heading', level: m[1].length, text: m[2] });
      } else if ((m = /^(\s*)[*+-]\s+(.*)$/.exec(line))) {
        items.push({ type: 'item', marker: 'bullet', indent: m[1], text: m[2], extra: [] });
      } else if ((m = /^(\s*)\d+[.)]\s+(.*)$/.exec(line))) {
        items.push({ type: 'item', marker: 'number', indent: m[1], text: m[2], extra: [] });
      } else if (/^\s/.test(line) && prev && prev.type === 'item' && !gap) {
        prev.extra.push(line); // continuation of the previous list item
      } else if (prev && prev.type === 'note' && !gap) {
        prev.text += '\n' + line;
      } else {
        items.push({ type: 'note', text: line });
      }
      gap = false;
    });
    return items;
  }

  function renderItems(items) {
    var out = [];
    var counters = {};
    function blank() { if (out.length && out[out.length - 1] !== '') out.push(''); }
    items.forEach(function (it) {
      if (it.type === 'heading') {
        blank();
        out.push(new Array((it.level || 4) + 1).join('#') + ' ' + it.text.trim());
        counters = {};
      } else if (it.type === 'note') {
        if (!String(it.text).trim()) return;
        blank();
        out.push(String(it.text).replace(/\s+$/, ''));
        out.push('');
        counters = {};
      } else {
        var text = String(it.text || '').trim();
        if (!text) return;
        var indent = it.indent || '';
        if (it.marker === 'number') {
          counters[indent] = (counters[indent] || 0) + 1;
          out.push(indent + counters[indent] + '. ' + text);
        } else {
          if (!indent) counters = {};
          out.push(indent + '* ' + text);
        }
        (it.extra || []).forEach(function (l) { out.push(l); });
      }
    });
    while (out.length && out[out.length - 1] === '') out.pop();
    return out.join('\n');
  }

  // ---------- header (times, servings, difficulty, source, anything else) ----------
  function parseHeader(lines) {
    var tokens = [];
    var meta = { prep: '', cook: '', time: '', serves: '', difficulty: null, sourceName: '', sourceUrl: '' };
    lines.forEach(function (raw) {
      var line = rtrim(raw);
      var m, matched = false;
      if ((m = DIFFICULTY_RE.exec(line))) {
        meta.difficulty = parseInt(m[1], 10);
        tokens.push({ type: 'meta', key: 'difficulty' });
        return;
      }
      if ((m = SOURCE_RE.exec(line))) {
        meta.sourceName = m[1]; meta.sourceUrl = m[2];
        tokens.push({ type: 'meta', key: 'source' });
        return;
      }
      for (var i = 0; i < META_RES.length; i++) {
        if ((m = META_RES[i][1].exec(line))) {
          meta[META_RES[i][0]] = m[1];
          tokens.push({ type: 'meta', key: META_RES[i][0] });
          matched = true;
          break;
        }
      }
      if (!matched) tokens.push({ type: 'raw', text: line });
    });
    while (tokens.length && tokens[tokens.length - 1].type === 'raw' && tokens[tokens.length - 1].text === '') tokens.pop();
    return { tokens: tokens, meta: meta };
  }

  function metaLine(key, meta) {
    if (key === 'difficulty') {
      return meta.difficulty ? '{% include difficulty.html difficulty_level=' + meta.difficulty + ' %}' : null;
    }
    if (key === 'source') {
      if (!meta.sourceUrl) return null;
      return '*Recipe adapted from [' + (meta.sourceName || hostName(meta.sourceUrl)) + '](' + meta.sourceUrl + ')*';
    }
    for (var i = 0; i < META_RES.length; i++) {
      if (META_RES[i][0] === key) {
        var v = String(meta[key] || '').trim();
        return v ? META_RES[i][2] + v : null;
      }
    }
    return null;
  }

  var META_ORDER = ['prep', 'cook', 'time', 'serves', 'difficulty', 'source'];

  function defaultHeaderTokens() {
    var t = [];
    ['prep', 'cook', 'time', 'serves', 'difficulty', 'source'].forEach(function (k) {
      t.push({ type: 'meta', key: k });
      t.push({ type: 'raw', text: '' });
    });
    t.push({ type: 'raw', text: '---' });
    return t;
  }

  function renderHeader(tokens, meta) {
    tokens = tokens.slice();
    // make sure every meta value that is set has a place to go
    META_ORDER.forEach(function (key, idx) {
      var has = tokens.some(function (t) { return t.type === 'meta' && t.key === key; });
      if (has || !metaLine(key, meta)) return;
      // insert after the closest earlier meta token, otherwise at the top
      var at = -1;
      for (var j = idx - 1; j >= 0 && at < 0; j--) {
        for (var k = tokens.length - 1; k >= 0; k--) {
          if (tokens[k].type === 'meta' && tokens[k].key === META_ORDER[j]) { at = k + 1; break; }
        }
      }
      if (at < 0) at = 0;
      tokens.splice(at, 0, { type: 'raw', text: '' }, { type: 'meta', key: key });
      if (at === 0) tokens.splice(0, 1);
    });
    var out = [];
    tokens.forEach(function (t) {
      if (t.type === 'raw') { out.push(t.text); return; }
      var l = metaLine(t.key, meta);
      if (l !== null) out.push(l);
      else if (out.length && out[out.length - 1] === '') out.pop(); // drop the gap a removed line leaves
    });
    // collapse runs of blank lines
    var clean = [];
    out.forEach(function (l) { if (!(l === '' && clean.length && clean[clean.length - 1] === '')) clean.push(l); });
    while (clean.length && clean[0] === '') clean.shift();
    while (clean.length && clean[clean.length - 1] === '') clean.pop();
    return clean.join('\n');
  }

  // ---------- whole post ----------
  function emptyRecipe() {
    return {
      path: null, sha: null,
      fmLines: null,
      title: '', date: '', permalink: '',
      meta: { prep: '', cook: '', time: '', serves: '', difficulty: null, sourceName: '', sourceUrl: '' },
      headerTokens: defaultHeaderTokens(),
      ingHeading: '### Ingredients', instHeading: '### Instructions',
      ingredients: [{ type: 'item', marker: 'bullet', indent: '', text: '', extra: [] }],
      instructions: [{ type: 'item', marker: 'number', indent: '', text: '', extra: [] }],
      after: '',
      structured: true,
      rawBody: ''
    };
  }

  function parsePost(text) {
    var fm = splitFrontMatter(text);
    var r = emptyRecipe();
    r.fmLines = fm.lines;
    r.title = fmGet(fm.lines, 'title');
    r.date = fmGet(fm.lines, 'date');
    r.permalink = fmGet(fm.lines, 'permalink');
    r.rawBody = fm.body;

    var lines = fm.body.split('\n');
    var ing = -1, inst = -1, end = lines.length;
    for (var i = 0; i < lines.length; i++) {
      if (ing < 0 && ING_HEAD_RE.test(rtrim(lines[i]))) ing = i;
      else if (ing >= 0 && inst < 0 && INST_HEAD_RE.test(rtrim(lines[i]))) inst = i;
      else if (inst >= 0 && (/^---\s*$/.test(lines[i]) || /^#{1,3}\s/.test(lines[i]))) { end = i; break; }
    }
    if (ing < 0 || inst < 0) {
      r.structured = false;
      return r;
    }
    var h = parseHeader(lines.slice(0, ing));
    r.headerTokens = h.tokens;
    r.meta = h.meta;
    r.ingHeading = rtrim(lines[ing]);
    r.instHeading = rtrim(lines[inst]);
    r.ingredients = parseItems(lines.slice(ing + 1, inst));
    r.instructions = parseItems(lines.slice(inst + 1, end));
    r.after = lines.slice(end).join('\n').replace(/\s+$/, '');

    // Safety net: if writing it back would change the recipe beyond spacing and
    // list numbering, fall back to editing the raw Markdown.
    if (normalize(fm.body) !== normalize(renderBody(r))) r.structured = false;
    return r;
  }

  function renderBody(r) {
    if (!r.structured) return String(r.rawBody || '').replace(/\s+$/, '') + '\n';
    var parts = [];
    var header = renderHeader(r.headerTokens, r.meta);
    if (header) parts.push(header);
    parts.push(r.ingHeading + '\n' + renderItems(r.ingredients));
    parts.push(r.instHeading + '\n' + renderItems(r.instructions));
    if (r.after && r.after.trim()) parts.push(r.after.replace(/^\n+/, ''));
    return parts.join('\n\n') + '\n';
  }

  function renderPost(r) {
    var lines = (r.fmLines && r.fmLines.length) ? r.fmLines.slice() : [
      'title: ""', 'date: ', 'categories: "recipe"', 'permalink: ', 'layout: post_layout', 'nav_category: chia_next_time'
    ];
    // only touch a front-matter line when its value really changed, so existing
    // files keep their exact formatting
    var title = r.title || 'Untitled recipe';
    if (fmGet(lines, 'title') !== title) fmSet(lines, 'title', yamlString(title));
    if (r.date && fmGet(lines, 'date') !== r.date) fmSet(lines, 'date', r.date);
    if (r.permalink && fmGet(lines, 'permalink') !== r.permalink) fmSet(lines, 'permalink', yamlString(r.permalink));
    return '---\n' + lines.join('\n') + '\n---\n\n' + renderBody(r);
  }

  /* Compare two bodies the way they would render: ignore blank lines,
   * trailing spaces, bullet style and list numbers. */
  function normalize(body) {
    return String(body || '').split('\n').map(rtrim).filter(function (l) { return l !== ''; }).map(function (l) {
      return l.replace(/^(\s*)[*+-]\s+/, '$1* ').replace(/^(\s*)\d+[.)]\s+/, '$1#. ');
    }).join('\n');
  }

  // ---------- importing ----------
  function hostName(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
  }

  function isoDuration(d) {
    if (!d || typeof d !== 'string') return '';
    var m = /^P(?:(\d+)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+)S)?)?$/i.exec(d.trim());
    if (!m) return d;
    var days = +(m[1] || 0), hrs = +(m[2] || 0), mins = Math.round(+(m[3] || 0));
    hrs += days * 24;
    hrs += Math.floor(mins / 60); mins = mins % 60;
    var parts = [];
    if (hrs) parts.push(hrs + (hrs === 1 ? ' hour' : ' hours'));
    if (mins) parts.push(mins + (mins === 1 ? ' minute' : ' minutes'));
    return parts.join(' ');
  }

  function decodeText(s, parser) {
    s = String(s == null ? '' : s);
    if (parser && /[<&]/.test(s)) {
      var doc = parser.parseFromString('<!doctype html><body>' + s, 'text/html');
      s = doc.body.textContent || '';
    }
    return deLiquid(s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim());
  }

  function hasType(o, t) {
    var ty = o && o['@type'];
    if (!ty) return false;
    return (Array.isArray(ty) ? ty : [ty]).some(function (x) { return String(x).toLowerCase() === t.toLowerCase(); });
  }

  function findRecipe(node, depth) {
    depth = depth || 0;
    if (!node || typeof node !== 'object' || depth > 8) return null;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        var f = findRecipe(node[i], depth + 1);
        if (f) return f;
      }
      return null;
    }
    if (hasType(node, 'Recipe')) return node;
    var keys = ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'item'];
    for (var k = 0; k < keys.length; k++) {
      var g = findRecipe(node[keys[k]], depth + 1);
      if (g) return g;
    }
    return null;
  }

  function instructionItems(ins, parser) {
    var items = [];
    function step(text) {
      text = decodeText(text, parser);
      if (text) items.push({ type: 'item', marker: 'number', indent: '', text: text, extra: [] });
    }
    function walk(x) {
      if (x == null) return;
      if (typeof x === 'string') {
        // a single string may hold several steps on separate lines
        var raw = x;
        if (parser && /<\s*(li|p|br)/i.test(raw)) {
          var doc = parser.parseFromString('<!doctype html><body>' + raw, 'text/html');
          var parts = Array.prototype.map.call(doc.querySelectorAll('li, p'), function (n) { return n.textContent; });
          if (parts.length) { parts.forEach(step); return; }
          raw = raw.replace(/<br\s*\/?>/gi, '\n');
        }
        raw.split(/\n+/).forEach(function (s) { step(s.replace(/^\s*(?:step\s*)?\d+[.):]\s*/i, '')); });
        return;
      }
      if (Array.isArray(x)) { x.forEach(walk); return; }
      if (hasType(x, 'HowToSection')) {
        var name = decodeText(x.name, parser);
        if (name) items.push({ type: 'heading', level: 4, text: name });
        walk(x.itemListElement || x.steps);
        return;
      }
      if (x.text || x.name) { step(x.text || x.name); return; }
      if (x.itemListElement) walk(x.itemListElement);
    }
    walk(ins);
    return items;
  }

  function yieldText(y) {
    if (Array.isArray(y)) {
      var strs = y.map(String).filter(Boolean);
      strs.sort(function (a, b) { return b.length - a.length; });
      return strs[0] || '';
    }
    return y == null ? '' : String(y);
  }

  function recipeFromJsonLd(obj, url, parser, siteName) {
    var r = emptyRecipe();
    r.title = decodeText(obj.name, parser);
    r.meta.prep = isoDuration(obj.prepTime);
    r.meta.cook = isoDuration(obj.cookTime);
    if (!r.meta.prep && !r.meta.cook) r.meta.time = isoDuration(obj.totalTime);
    r.meta.serves = decodeText(yieldText(obj.recipeYield), parser);
    var ings = obj.recipeIngredient || obj.ingredients || [];
    if (!Array.isArray(ings)) ings = [ings];
    r.ingredients = ings.map(function (s) { return decodeText(s, parser); }).filter(Boolean).map(function (t) {
      return { type: 'item', marker: 'bullet', indent: '', text: t, extra: [] };
    });
    r.instructions = instructionItems(obj.recipeInstructions, parser);
    r.meta.sourceUrl = url || '';
    r.meta.sourceName = siteName || hostName(url);
    if (!r.ingredients.length) r.ingredients = emptyRecipe().ingredients;
    if (!r.instructions.length) r.instructions = emptyRecipe().instructions;
    return r;
  }

  /* Parse a fetched HTML page. Returns a recipe or null. */
  function recipeFromHtml(html, url, parser) {
    var doc = parser.parseFromString(html, 'text/html');
    var siteMeta = doc.querySelector('meta[property="og:site_name"]');
    var siteName = siteMeta ? decodeText(siteMeta.getAttribute('content'), parser) : '';
    var scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      var json;
      try { json = JSON.parse(scripts[i].textContent); } catch (e) { continue; }
      var found = findRecipe(json);
      if (found) return recipeFromJsonLd(found, url, parser, siteName);
    }
    // microdata fallback
    var scope = doc.querySelector('[itemtype*="schema.org/Recipe"]');
    if (scope) {
      var prop = function (name) { return scope.querySelectorAll('[itemprop="' + name + '"]'); };
      var text = function (n) { return n ? (n.getAttribute('content') || n.textContent) : ''; };
      var obj = {
        name: text(prop('name')[0]),
        prepTime: text(prop('prepTime')[0]),
        cookTime: text(prop('cookTime')[0]),
        totalTime: text(prop('totalTime')[0]),
        recipeYield: text(prop('recipeYield')[0]),
        recipeIngredient: Array.prototype.map.call(prop('recipeIngredient').length ? prop('recipeIngredient') : prop('ingredients'), text),
        recipeInstructions: Array.prototype.map.call(prop('recipeInstructions'), text)
      };
      if (obj.recipeIngredient.length) return recipeFromJsonLd(obj, url, parser, siteName);
    }
    return null;
  }

  /* A Cooked.wiki link such as cooked.wiki/https://site.com/recipe holds the original address. */
  function unwrapCookedUrl(input) {
    var s = String(input || '').trim();
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    try {
      var u = new URL(s);
      if (/(^|\.)cooked\.wiki$/i.test(u.hostname)) {
        var rest = decodeURIComponent((u.pathname + u.search).replace(/^\/+/, ''));
        var m = /^(https?:\/?\/?)(.*)$/i.exec(rest);
        if (m) return { url: m[1].replace(/:\/?\/?$/, '://') + m[2], viaCooked: true };
        return { url: u.href, viaCooked: true, cookedPage: true };
      }
      return { url: u.href, viaCooked: false };
    } catch (e) {
      return { url: s, viaCooked: false };
    }
  }

  /* Pasted plain text: needs "Ingredients" and "Instructions"/"Directions"/"Method" lines. */
  function recipeFromText(text) {
    var lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    var ing = -1, inst = -1;
    lines.forEach(function (l, i) {
      var t = l.trim().replace(/[:#*]/g, '').trim();
      if (ing < 0 && /^ingredients?$/i.test(t)) ing = i;
      else if (ing >= 0 && inst < 0 && /^(instructions|directions|method|steps|preparation)$/i.test(t)) inst = i;
    });
    if (ing < 0 || inst < 0) return null;
    var r = emptyRecipe();
    var before = lines.slice(0, ing).map(function (l) { return l.trim(); }).filter(Boolean);
    if (before.length) r.title = deLiquid(before[0]);
    function clean(l) { return deLiquid(l.replace(/^\s*(?:[*•●+-]|\d+[.)]|step\s*\d+[.:)]?)\s*/i, '').trim()); }
    function toItems(ls, marker) {
      var out = [];
      ls.forEach(function (l) {
        var t = l.trim();
        if (!t) return;
        if (/:$/.test(t) && t.length < 60 && !/^\d/.test(t)) {
          out.push({ type: 'heading', level: 4, text: deLiquid(t.replace(/:$/, '')) });
        } else {
          var c = clean(t);
          if (c) out.push({ type: 'item', marker: marker, indent: '', text: c, extra: [] });
        }
      });
      return out;
    }
    r.ingredients = toItems(lines.slice(ing + 1, inst), 'bullet');
    r.instructions = toItems(lines.slice(inst + 1), 'number');
    if (!r.ingredients.length) r.ingredients = emptyRecipe().ingredients;
    if (!r.instructions.length) r.instructions = emptyRecipe().instructions;
    return r;
  }

  // ---------- preview helpers ----------
  /* Turn the Jekyll-specific bits of a post body into something a browser preview can show. */
  function previewMarkdown(body, avocadoUrl) {
    return String(body || '')
      .replace(/^\{%\s*include\s+difficulty\.html\s+difficulty_level\s*=\s*(\d+)\s*%\}[ \t]*$/gm, function (_, n) {
        var imgs = '';
        for (var i = 0; i < +n; i++) imgs += '<img src="' + avocadoUrl + '" alt="avocado icon" class="difficulty_item">';
        return '<div id="difficulty"><p class="difficulty_item">Difficulty (out of 5):</p>' + imgs + '</div>';
      })
      .replace(/^\{%\s*include\s+image_gallery\.html[^%]*%\}[ \t]*$/gm, '<p class="rs-placeholder">[photo gallery]</p>')
      .replace(/\{\{\s*site\.baseurl\s*\}\}/g, '')
      .replace(/\{%[\s\S]*?%\}/g, '')
      .replace(/\{:[^}]*\}/g, '');
  }

  var api = {
    slugify: slugify, yamlString: yamlString, deLiquid: deLiquid,
    splitFrontMatter: splitFrontMatter, fmGet: fmGet,
    parsePost: parsePost, renderPost: renderPost, renderBody: renderBody, normalize: normalize,
    emptyRecipe: emptyRecipe, parseItems: parseItems, renderItems: renderItems,
    isoDuration: isoDuration, recipeFromHtml: recipeFromHtml, recipeFromText: recipeFromText,
    unwrapCookedUrl: unwrapCookedUrl, hostName: hostName, previewMarkdown: previewMarkdown
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RecipeCore = api;
})(this);
