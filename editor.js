// Kurd Technology — ئیدیتۆری کۆد (VS Code / Acode بۆ ناو سایتەکە). تەنها بۆ owner.
// کۆدەکان لە خشتەی site_code پاشەکەوت دەکرێن و site-code.js لە هەموو پەڕەکان جێبەجێیان دەکات.

window.addEventListener('kurdtech:ready', async () => {
  const sb = window.kurdtechSupabase;
  const profile = window.kurdtechProfile;
  if (!profile || profile.role !== 'owner') { location.href = 'services.html'; return; }
  if (!window.CodeMirror) { alert('نەتوانرا ئیدیتۆر بار بکرێت (CodeMirror). ئینتەرنێتەکەت بپشکنە.'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const EXT = { js: '.js', css: '.css', html: '.html' };
  const MODE = { js: 'javascript', css: 'css', html: 'htmlmixed', json: { name: 'javascript', json: true }, xml: 'xml', txt: 'text/plain' };
  const KIND_BY_EXT = { html: 'html', htm: 'html', js: 'js', mjs: 'js', css: 'css', json: 'json', svg: 'xml', xml: 'xml' };
  const extOf = (p) => (p.split('.').pop() || '').toLowerCase();
  const kindOfPath = (p) => KIND_BY_EXT[extOf(p)] || 'txt';
  const SITE = '__site';
  // فایلەکانی GitHub کە دەکرێت لێرە بگۆڕدرێن (فایلی نوێش دەکرێت دروست بکرێت). ئەوانەی PROTECTED نین.
  const MANIFEST = [
    'index.html', 'services.html', 'admin.html', 'cv-builder.html', 'games.html', 'student.html', 'custom.html',
    'style.css', 'services.css', 'admin.css', 'cv-builder.css', 'cv-extras.css', 'games.css', 'student.css', 'chat.css', 'profile.css',
    'auth.js', 'guard.js', 'device.js', 'theme.js', 'services.js', 'app-auth-ui.js', 'profile.js', 'chat.js', 'admin.js', 'admin-photo-editor.js',
    'cv-builder.js', 'cv-extras.js', 'games-render.js', 'student.js', 'sections-icons.js', 'sections-render.js'
  ];
  const PROTECTED = ['sw.js', 'config.js', 'site-code.js', 'editor.html', 'editor.js', 'editor.css'];
  const TEXT_EXT = ['html', 'htm', 'js', 'mjs', 'css', 'json', 'svg', 'xml', 'txt', 'md', 'csv'];
  const KNOWN = ['*', 'index', 'services', 'cv-builder', 'games', 'student', 'admin'];
  const PAGE_LABEL = {
    '*': '🌐 هەموو پەڕەکان', index: '🔑 index (چوونەژوورەوە)', services: '🧩 services', 'cv-builder': '📄 cv-builder',
    games: '🎮 games', student: '🎓 student', admin: '🛠 admin (پانێڵی ئادمین)'
  };
  const pageLabel = (p) => p === SITE ? '📂 فایلەکانی سایت (GitHub)' : PAGE_LABEL[p] || (p.startsWith('custom-') ? '📄 پەڕەی نوێ: ' + p.slice(7) : '📁 ' + p);

  // ---------- نموونەکان ----------
  const TEMPLATES = [
    { t: 'JS بەتاڵ', d: 'فایلێکی JavaScript بۆ پەڕەیەک', page: '*', kind: 'js', name: 'سکریپتی نوێ', code:
`// sb = Supabase  |  user  |  profile  |  page
console.log('کار دەکات لە پەڕەی', page);
` },
    { t: 'CSS — گۆڕینی دیزاین', d: 'ڕەنگ و ستایل بۆ هەموو سایتەکە', page: '*', kind: 'css', name: 'ستایلی نوێ', code:
`/* نموونە: گۆڕینی ڕەنگ و دوگمە لە هەموو پەڕەکان */
:root{ --gold:#FDBA12; }
button{ letter-spacing:0; }
` },
    { t: 'HTML — بەشێکی نوێ', d: 'ناوەڕۆکی نوێ لە کۆتایی پەڕە یان لە شوێنێکی دیاریکراو', page: 'services', kind: 'html', name: 'بەشی نوێ', code:
`<section style="padding:16px;">
  <h2 style="font-family:'Noto Kufi Arabic',sans-serif;margin-bottom:10px;">بەشی نوێ</h2>
  <p style="color:rgba(255,255,255,.7);line-height:2;">ئەمە بەشێکی نوێیە. هەر HTMLێک لێرە بنووسە.</p>
</section>
` },
    { t: 'پەڕەی تەواو نوێ', d: 'پەڕەیەکی نوێ بە ئەدرەسی custom.html?p=offers', page: 'custom-offers', kind: 'html', name: 'پەڕەی پێشکەشەکان', code:
`<h2 style="font-family:'Noto Kufi Arabic',sans-serif;margin-bottom:10px;">پێشکەشەکان</h2>
<p style="color:rgba(255,255,255,.7);line-height:2;">ئەمە پەڕەیەکی نوێیە. ناوی پەڕە لە ڕێکخستنی فایل (⚙) بگۆڕە.</p>
` },
    { t: 'کارتێکی نوێ لە خزمەتگوزارییەکان', d: 'دوگمەیەک بۆ پەڕەی نوێ', page: 'services', kind: 'js', name: 'کارتی نوێ', code:
`const grid = document.getElementById('cardsGrid');
if (grid) {
  const a = document.createElement('a');
  a.className = 'cat-card theme-games';
  a.href = 'custom.html?p=offers';
  a.innerHTML = '<h3>پێشکەشەکان</h3><p>بەشێکی نوێ</p>';
  grid.appendChild(a);
}
` },
    { t: 'دیزاینی نوێی CV', d: 'زیادکردنی دیزاینێک بۆ CV Builder', page: 'cv-builder', kind: 'js', name: 'دیزاینی نوێی CV', code:
`// id دەبێت لە ١٥١ بەرەوژوور بێت و دووبارە نەبێتەوە
KurdCV.addDesign({
  id: 151,
  shape: 'sidebar',     // classic | sidebar | geometric | overlap | minimal
  hd: 'grad',           // solid | grad | light
  photo: 'round',       // round | soft | sq
  accent: '#E11D48',
  deep: '#4C0519',
  font: 'kufi', bg: 'cream', st: 'pill'
});
` },
    { t: 'بەشی ئادمینی نوێ', d: 'کارتێکی نوێ لە پانێڵی ئادمین (بۆ نموونە ئامار)', page: 'admin', kind: 'js', name: 'بەشی ئادمینی نوێ', code:
`// بەشێکی نوێ لە پانێڵی ئادمین. تەنها owner دەیبینێت چونکە admin.html تەنها بۆ ownerە.
const wrap = document.querySelector('main.wrap');
if (wrap) {
  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = 'بەشی نوێ ✨';
  const box = document.createElement('div');
  box.className = 'loading-hint';
  box.textContent = 'باردەکرێت...';
  wrap.insertBefore(title, wrap.firstElementChild.nextSibling);
  wrap.insertBefore(box, title.nextSibling);

  // نموونە: ژمارەی سەرجەم CVـەکان
  const { count } = await sb.from('profiles').select('*', { count: 'exact', head: true });
  box.textContent = 'ژمارەی بەکارهێنەران: ' + (count ?? '؟');
}
` },
    { t: 'Supabase — خوێندنەوەی داتا', d: 'نموونەی داواکردنی داتا لە داتابەیس', page: 'services', kind: 'js', name: 'خوێندنەوەی داتا', code:
`const { data, error } = await sb.from('profiles').select('full_name').limit(5);
if (error) console.error(error);
else console.log('بەکارهێنەران:', data);
` }
  ];

  // ---------- دۆخ ----------
  let files = [];          // هەموو فایلەکان
  let open = [];           // تابە کراوەکان (key)
  let activeKey = null;
  let tmp = 0;
  const closedGroups = new Set([SITE]);
  let overrides = new Map(); // path -> row لە site_files
  let siteOk = true;

  const cm = CodeMirror.fromTextArea($('ta'), {
    theme: 'material-darker', lineNumbers: true, lineWrapping: false, indentUnit: 2, tabSize: 2, indentWithTabs: false,
    autoCloseBrackets: true, autoCloseTags: true, matchBrackets: true, styleActiveLine: true,
    foldGutter: true, gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    extraKeys: {
      'Ctrl-S': () => save(), 'Cmd-S': () => save(),
      'Ctrl-Space': 'autocomplete', 'Cmd-Space': 'autocomplete',
      'Ctrl-/': 'toggleComment', 'Cmd-/': 'toggleComment',
      'Ctrl-Enter': () => togglePreview(true), 'Cmd-Enter': () => togglePreview(true),
      'Tab': (c) => c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('  ', 'end'),
      'Shift-Tab': (c) => c.indentSelection('subtract')
    }
  });
  const dummyDoc = cm.getDoc();

  // ---------- یارمەتیدەر ----------
  function toast(msg, err) {
    const t = $('toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), err ? 4200 : 1800);
  }
  const byKey = (k) => files.find(f => f.key === k);
  const cur = () => byKey(activeKey);
  const metaOf = (f) => JSON.stringify([f.name, f.page, f.kind, f.target || '', !!f.enabled, +f.sort_order || 0]);
  const isDirty = (f) => f.site ? (f.loaded && !f.busy && !f.readonly && (f.fresh || f.doc.getValue() !== f.saved.code)) : (!f.id || f.doc.getValue() !== f.saved.code || metaOf(f) !== f.saved.meta);
  const fileName = (f) => f.site ? f.path : f.name + EXT[f.kind];

  function makeFile(row) {
    const f = {
      key: row.id ? 'id' + row.id : 'n' + (++tmp),
      id: row.id || null,
      name: row.name || 'بێ ناو', page: row.page || '*', kind: row.kind || 'js',
      target: row.target || '', enabled: row.enabled !== false, sort_order: row.sort_order || 0,
      doc: CodeMirror.Doc(row.code || '', MODE[row.kind || 'js'])
    };
    f.saved = row.id ? { code: row.code || '', meta: metaOf(f) } : { code: '', meta: '' };
    f.doc.on('change', onDocChange);
    return f;
  }

  function makeSiteFile(path, row) {
    const bin = !!(row && row.encoding === 'base64');
    const f = {
      key: 's:' + path, site: true, path, name: path, page: SITE, kind: bin ? 'bin' : kindOfPath(path),
      ov: !!row, fresh: false, enabled: true, readonly: bin, target: '', sort_order: 0, id: null,
      loaded: !!row, doc: CodeMirror.Doc(bin ? '[فایلی دووانەیی — ' + Math.round((row.content.length * 0.75) / 1024) + ' KB — لێرە ناگۆڕدرێت]' : (row ? row.content : ''), MODE[kindOfPath(path)] || 'text/plain')
    };
    f.saved = { code: row && !bin ? row.content : '', meta: '' };
    f.doc.on('change', onDocChange);
    return f;
  }
  async function loadOriginal(f) {
    try {
      const r = await fetch('/' + f.path + (f.path.includes('?') ? '&' : '?') + 'kf_orig=1&_=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const t = await r.text();
      f.doc.setValue(t); f.doc.clearHistory(); f.saved.code = t; f.loaded = true;
    } catch (e) { f.loaded = true; f.doc.setValue('/* نەتوانرا ئۆریجینال بار بکرێت: ' + e.message + ' */'); f.saved.code = f.doc.getValue(); }
  }
  // پەیام بۆ Service Worker (sync / preview)
  async function swPost(msg, timeout) {
    try {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration('/');
      const w = reg && reg.active; if (!w) return false;
      return await new Promise(res => {
        const ch = new MessageChannel(), t = setTimeout(() => res(false), timeout || 3000);
        ch.port1.onmessage = (e) => { clearTimeout(t); res(e.data || true); };
        w.postMessage(msg, [ch.port2]);
      });
    } catch (e) { return false; }
  }

  // ---------- بارکردن ----------
  async function load(keepOpen) {
    const { data, error } = await sb.from('site_code').select('*').order('page').order('sort_order').order('id');
    if (error) {
      $('tree').innerHTML = '<div class="hint">نەتوانرا بار بکرێت: ' + esc(error.message) + '<br>فایلی <b dir="ltr">site-code.sql</b> لە Supabase ڕەن بکە (تەنها جارێک).</div>';
      return false;
    }
    const unsavedNew = files.filter(f => !f.id && !f.site);
    // فایلەکانی سایت (site_files)
    overrides = new Map(); siteOk = true;
    const sf = await sb.from('site_files').select('path,content,encoding,mime,enabled,updated_at').order('path');
    if (sf.error) { siteOk = false; console.warn('site_files:', sf.error.message); }
    else (sf.data || []).forEach(r => overrides.set(r.path, r));
    const sitePaths = MANIFEST.concat([...overrides.keys()].filter(p => !MANIFEST.includes(p))).sort();
    const siteFiles = siteOk ? sitePaths.map(p => makeSiteFile(p, overrides.get(p))) : [];
    const oldOpen = keepOpen ? open.slice() : [];
    const oldActive = activeKey;
    files = (data || []).map(makeFile).concat(unsavedNew, siteFiles);
    open = oldOpen.filter(k => byKey(k));
    activeKey = byKey(oldActive) ? oldActive : (open[0] || null);
    renderAll();
    if (activeKey) activate(activeKey, true); else showEmpty();
    return true;
  }

  // ---------- ڕێندەر ----------
  function renderTree() {
    const q = ($('fileSearch').value || '').trim().toLowerCase();
    const groups = {};
    files.forEach(f => {
      if (q && !(fileName(f).toLowerCase().includes(q) || f.page.toLowerCase().includes(q))) return;
      (groups[f.page] = groups[f.page] || []).push(f);
    });
    const order = Object.keys(groups).sort((a, b) => (a === SITE ? 1 : b === SITE ? -1 : a === '*' ? -1 : b === '*' ? 1 : a.localeCompare(b)));
    const siteHint = (!siteOk) ? '<div class="hint">بۆ بەشی «فایلەکانی سایت»، فایلی <b dir="ltr">site-files.sql</b> لە Supabase ڕەن بکە (تەنها جارێک).</div>' : '';
    $('tree').innerHTML = siteHint + order.map(p => `
      <div class="grp ${closedGroups.has(p) ? 'closed' : ''}" data-p="${esc(p)}">
        <div class="gh"><span class="ar">▼</span><span>${esc(pageLabel(p))}</span><span class="n">${groups[p].length}</span></div>
        <div class="files">${groups[p].map(f => `
          <div class="file ${f.key === activeKey ? 'active' : ''}" data-k="${f.key}">
            <span class="ic ${f.kind}">${f.kind === 'js' ? 'JS' : f.kind === 'css' ? '#' : f.kind === 'html' ? '<>' : f.kind === 'json' ? '{}' : f.kind === 'bin' ? '▣' : '≡'}</span>
            <span class="nm">${esc(fileName(f))}</span>
            ${f.site ? (f.ov ? '<span class="ovr">گۆڕاو</span>' : '') : (f.enabled ? '' : '<span class="off">ناچالاک</span>')}
            ${isDirty(f) ? '<span class="dot"></span>' : ''}
          </div>`).join('')}</div>
      </div>`).join('') || '<div class="hint">هیچ فایلێک نییە. بە دوگمەی ＋ فایلی نوێ دروست بکە.</div>';
  }
  function renderTabs() {
    $('tabs').innerHTML = open.map(k => {
      const f = byKey(k); if (!f) return '';
      return `<div class="tab ${k === activeKey ? 'active' : ''}" data-k="${k}">
        <span class="t">${esc(fileName(f))}</span>${isDirty(f) ? '<span class="dot"></span>' : ''}<span class="x" data-x="${k}">✕</span></div>`;
    }).join('');
    const a = $('tabs').querySelector('.tab.active'); if (a) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function renderStatus() {
    const f = cur();
    $('curPath').textContent = f ? (f.site ? f.path : f.page + ' / ' + fileName(f)) : '';
    $('stKind').textContent = f ? ({ js: 'JavaScript', css: 'CSS', html: 'HTML' }[f.kind] || (f.kind || '').toUpperCase()) : '';
    const d = f && isDirty(f);
    $('stState').innerHTML = !f ? '' : d ? '<span class="warn">● پاشەکەوت نەکراوە</span>' : '<span class="ok">✓ پاشەکەوتکراوە</span>';
    $('btnSave').classList.toggle('dirty', !!d);
    const anyDirty = files.some(isDirty);
    document.title = (anyDirty ? '● ' : '') + 'ئیدیتۆری کۆد | Kurd Technology';
  }
  function renderAll() { renderTree(); renderTabs(); renderStatus(); }
  function showEmpty() { $('emptyState').style.display = 'flex'; cm.swapDoc(dummyDoc); renderAll(); }

  // ---------- تاب و چالاککردن ----------
  function activate(key, silent) {
    const f = byKey(key); if (!f) return;
    activeKey = key;
    if (!open.includes(key)) open.push(key);
    $('emptyState').style.display = 'none';
    cm.swapDoc(f.doc);
    cm.setOption('mode', MODE[f.site ? kindOfPath(f.path) : f.kind] || 'text/plain');
    cm.setOption('readOnly', f.readonly ? 'nocursor' : false);
    if (f.site && !f.loaded) { f.loaded = true; f.busy = true; f.doc.setValue('/* بار دەکرێت... */'); loadOriginal(f).then(() => { f.busy = false; if (activeKey === f.key) { cm.refresh(); } renderAll(); }); }
    renderAll();
    closeSide();
    if (!silent && window.innerWidth > 820) cm.focus();
    cm.refresh();
    if ($('prev').classList.contains('open')) refreshPreview(true);
  }
  function closeTab(key) {
    const f = byKey(key);
    if (f && isDirty(f) && !confirm('گۆڕانکارییەکانی «' + fileName(f) + '» پاشەکەوت نەکراون. دابخرێت؟')) return;
    if (f && f.site) {
      if (f.fresh) { files = files.filter(x => x !== f); }
      else if (isDirty(f)) { f.doc.setValue(f.saved.code); f.doc.clearHistory(); }
    }
    else if (f && !f.id) files = files.filter(x => x !== f);
    else if (f && f.id && isDirty(f)) { // گەڕاندنەوە بۆ دۆخی پاشەکەوتکراو
      f.doc.setValue(f.saved.code); const m = JSON.parse(f.saved.meta);
      [f.name, f.page, f.kind, f.target, f.enabled, f.sort_order] = m; f.doc.clearHistory();
    }
    const i = open.indexOf(key); open = open.filter(k => k !== key);
    if (activeKey === key) { activeKey = open[Math.min(i, open.length - 1)] || null; }
    if (activeKey) activate(activeKey, true); else showEmpty();
  }

  // ---------- گۆڕانکاری ----------
  let prevTimer;
  function onDocChange() {
    renderTabs(); renderStatus();
    const f = cur(); if (f) { const d = isDirty(f); if (f._d !== d) { f._d = d; renderTree(); } }
    if ($('prev').classList.contains('open') && $('liveChk').checked) {
      clearTimeout(prevTimer); prevTimer = setTimeout(() => refreshPreview(true), 900);
    }
  }
  cm.on('cursorActivity', () => { const p = cm.getCursor(); $('stPos').textContent = 'Ln ' + (p.line + 1) + ', Col ' + (p.ch + 1); });

  // ---------- پاشەکەوت ----------
  async function saveFile(f) {
    if (f.site) {
      if (f.readonly) throw new Error('ئەم فایلە ناگۆڕدرێت');
      if (PROTECTED.includes(f.path)) throw new Error('ئەم فایلە پارێزراوە');
      const content = f.doc.getValue();
      const r = await sb.from('site_files').upsert({ path: f.path, content, encoding: 'text', enabled: true }, { onConflict: 'path' }).select().single();
      if (r.error) throw r.error;
      overrides.set(f.path, r.data);
      f.ov = true; f.fresh = false; f.saved.code = content;
      swPost({ type: 'sync' });
      return;
    }
    const row = {
      name: f.name.trim() || 'بێ ناو', page: f.page, kind: f.kind,
      target: f.kind === 'html' ? (f.target.trim() || null) : null,
      code: f.doc.getValue(), enabled: !!f.enabled, sort_order: +f.sort_order || 0,
      updated_at: new Date().toISOString()
    };
    let res;
    if (f.id) res = await sb.from('site_code').update(row).eq('id', f.id).select().single();
    else res = await sb.from('site_code').insert(row).select().single();
    if (res.error) throw res.error;
    const d = res.data;
    if (!f.id) { // کلیلی تاب بگۆڕە
      const old = f.key; f.id = d.id; f.key = 'id' + d.id;
      open = open.map(k => k === old ? f.key : k); if (activeKey === old) activeKey = f.key;
    }
    f.name = d.name; f.target = d.target || '';
    f.saved = { code: row.code, meta: metaOf(f) };
  }
  async function save() {
    const f = cur(); if (!f) return;
    if (!isDirty(f)) { toast('هیچ گۆڕانکارییەک نییە'); return; }
    $('btnSave').disabled = true;
    try { await saveFile(f); toast('✓ پاشەکەوت کرا — ئێستا بۆ هەمووان چالاکە'); }
    catch (e) { toast('نەتوانرا پاشەکەوت بکرێت: ' + (e.message || e), true); }
    $('btnSave').disabled = false; renderAll();
  }
  async function saveAll() {
    const list = files.filter(isDirty); if (!list.length) { toast('هەمووی پاشەکەوتکراوە'); return; }
    let n = 0;
    for (const f of list) { try { await saveFile(f); n++; } catch (e) { toast('هەڵە لە «' + fileName(f) + '»: ' + (e.message || e), true); } }
    renderAll(); if (n) toast('✓ ' + n + ' فایل پاشەکەوت کرا');
  }

  // ---------- فایلی نوێ ----------
  function newFile(tpl) {
    const f = makeFile({
      name: tpl.name, page: tpl.page, kind: tpl.kind, code: tpl.code, enabled: true,
      target: tpl.target || '', sort_order: 0
    });
    f.saved = { code: '', meta: '' }; // بە نوێ دادەنرێت (dirty)
    files.push(f); activate(f.key);
    closeSheet('newWrap');
    toast('فایلی نوێ دروست کرا — Ctrl+S بۆ پاشەکەوت');
  }
  function openNew() {
    $('tplList').innerHTML = `<button class="tpl" data-site="1"><b>📂 فایلی سایت (هەر شوێنێک)</b><span>پەڕە یان فایلی نوێ وەک about.html یان js/app.js — راستەوخۆ بۆ هەمووان</span></button>` + TEMPLATES.map((t, i) => `<button class="tpl" data-i="${i}"><b>${esc(t.t)}</b><span>${esc(t.d)}</span></button>`).join('');
    openSheet('newWrap');
  }
  $('tplList').addEventListener('click', (e) => { const b = e.target.closest('.tpl'); if (!b) return; if (b.dataset.site) createSiteFile(); else newFile(TEMPLATES[+b.dataset.i]); });

  // ---------- ڕێکخستنی فایل ----------
  function fillPageSelect(selected) {
    const customs = [...new Set(files.map(f => f.page).filter(p => p.startsWith('custom-')))];
    const opts = KNOWN.map(p => [p, pageLabel(p)]).concat(customs.map(p => [p, pageLabel(p)])).concat([['__new', '➕ پەڕەی نوێ...']]);
    $('pPage').innerHTML = opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
    $('pPage').value = opts.some(o => o[0] === selected) ? selected : '*';
  }
  function syncProps() {
    $('pSlugWrap').hidden = $('pPage').value !== '__new';
    $('pTargetWrap').hidden = $('pKind').value !== 'html';
    let page = $('pPage').value; const slug = ($('pSlug').value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (page === '__new') page = slug ? 'custom-' + slug : '';
    $('pLink').textContent = page.startsWith('custom-') ? 'custom.html?p=' + page.slice(7) : (page && page !== '*' ? page + '.html' : '');
  }
  function openProps() {
    const f = cur(); if (!f) { toast('سەرەتا فایلێک بکەرەوە'); return; }
    if (f.site) { openSiteSheet(f); return; }
    $('pName').value = f.name; fillPageSelect(f.page); $('pKind').value = f.kind;
    $('pSlug').value = ''; $('pTarget').value = f.target || ''; $('pOrder').value = f.sort_order || 0; $('pEnabled').checked = !!f.enabled;
    $('pDelete').style.display = f.id ? '' : 'none';
    syncProps(); openSheet('propsWrap');
  }
  ['pPage', 'pKind'].forEach(id => $(id).addEventListener('change', syncProps));
  $('pSlug').addEventListener('input', syncProps);
  $('pOk').addEventListener('click', () => {
    const f = cur(); if (!f) return;
    let page = $('pPage').value;
    if (page === '__new') {
      const slug = ($('pSlug').value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!slug) { toast('ناوی پەڕەی نوێ بنووسە (ئینگلیزی)', true); return; }
      page = 'custom-' + slug;
    }
    f.name = $('pName').value.trim() || 'بێ ناو'; f.page = page; f.kind = $('pKind').value;
    f.target = f.kind === 'html' ? $('pTarget').value.trim() : ''; f.sort_order = +$('pOrder').value || 0; f.enabled = $('pEnabled').checked;
    cm.setOption('mode', MODE[f.kind]);
    closeSheet('propsWrap'); renderAll();
    if ($('prev').classList.contains('open')) refreshPreview(true);
  });
  $('pDelete').addEventListener('click', async () => {
    const f = cur(); if (!f || !f.id) return;
    if (!confirm('«' + fileName(f) + '» بە تەواوی بسڕدرێتەوە؟ ئەمە لە سایتەکەش لادەچێت.')) return;
    const { error } = await sb.from('site_code').delete().eq('id', f.id);
    if (error) { toast('نەتوانرا بسڕدرێتەوە: ' + error.message, true); return; }
    files = files.filter(x => x !== f); open = open.filter(k => k !== f.key);
    closeSheet('propsWrap'); activeKey = open[0] || null;
    if (activeKey) activate(activeKey, true); else showEmpty();
    toast('سڕایەوە');
  });
  $('pDup').addEventListener('click', () => {
    const f = cur(); if (!f) return;
    const c = makeFile({ name: f.name + ' (کۆپی)', page: f.page, kind: f.kind, code: f.doc.getValue(), enabled: false, target: f.target, sort_order: f.sort_order });
    c.saved = { code: '', meta: '' }; files.push(c); closeSheet('propsWrap'); activate(c.key);
  });

  // ---------- فایلەکانی سایت: ڕێکخستن، مێژوو، فایلی نوێ، بارکردن ----------
  const fmtTime = (t) => { try { return new Date(t).toLocaleString('ckb-IQ'); } catch (e) { return t; } };
  async function openSiteSheet(f) {
    $('sPath').textContent = f.path;
    $('sState').textContent = f.readonly ? 'فایلی دووانەیی (وێنە/فۆنت...) — ناگۆڕدرێت، تەنها دەتوانیت بیسڕیتەوە'
      : f.ov ? '✏️ ئەم فایلە لێرە گۆڕاوە — وەشانی GitHub جێگیر کراوەتەوە بۆ هەمووان'
      : f.fresh ? '🆕 فایلی نوێ — پاشەکەوتی بکە' : '📄 ئەمە وەشانی GitHubـە. هەر گۆڕانکارییەک و پاشەکەوت = بۆ هەمووان جێگیر دەبێت';
    $('sOpen').href = '/' + f.path + (kindOfPath(f.path) === 'html' ? '?safe=1' : '');
    $('sRestore').textContent = MANIFEST.includes(f.path) ? '↺ گەڕاندنەوە بۆ ئۆریجینالی GitHub' : '🗑 سڕینەوەی ئەم فایلە';
    $('sRestore').style.display = (f.ov || f.fresh) ? '' : 'none';
    $('sHist').innerHTML = '<div class="hint">باردەکرێت...</div>';
    openSheet('siteWrap');
    const h = await sb.from('site_files_history').select('id,saved_at,content,encoding').eq('path', f.path).order('saved_at', { ascending: false }).limit(30);
    if (h.error || !h.data || !h.data.length) { $('sHist').innerHTML = '<div class="hint">هێشتا مێژوو نییە (دوای یەکەم گۆڕانکاری دروست دەبێت).</div>'; return; }
    f._hist = h.data;
    $('sHist').innerHTML = h.data.map((x, i) => `<button class="tpl" data-h="${i}"><b>${esc(fmtTime(x.saved_at))}</b><span>${x.content.length.toLocaleString()} پیت — کرتە بکە بۆ هێنانەوە بۆ ئیدیتۆر</span></button>`).join('');
  }
  $('sHist').addEventListener('click', (e) => {
    const b = e.target.closest('[data-h]'); const f = cur(); if (!b || !f || !f._hist) return;
    const x = f._hist[+b.dataset.h]; if (!x || x.encoding !== 'text') { toast('ئەم وەشانە دووانەییە', true); return; }
    f.doc.setValue(x.content); closeSheet('siteWrap'); toast('وەشانی کۆن هێنرا — پاشەکەوتی بکە بۆ جێگیرکردن');
  });
  $('sCopyOrig').addEventListener('click', async () => {
    const f = cur(); if (!f || f.readonly) return;
    try {
      const r = await fetch('/' + f.path + '?kf_orig=1&_=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      f.doc.setValue(await r.text()); closeSheet('siteWrap'); toast('ئۆریجینال هێنرا — پاشەکەوتی بکە یان وازی لێ بهێنە');
    } catch (e) { toast('ئۆریجینال نەدۆزرایەوە: ' + e.message, true); }
  });
  $('sRestore').addEventListener('click', async () => {
    const f = cur(); if (!f) return;
    const isOrig = MANIFEST.includes(f.path);
    if (!confirm(isOrig ? 'دەگەڕێتەوە بۆ وەشانی GitHub بۆ هەمووان. بەردەوام؟' : 'ئەم فایلە بە تەواوی دەسڕدرێتەوە. بەردەوام؟')) return;
    if (f.ov) {
      const { error } = await sb.from('site_files').delete().eq('path', f.path);
      if (error) { toast('نەتوانرا: ' + error.message, true); return; }
      overrides.delete(f.path); swPost({ type: 'sync' });
    }
    f.ov = false; f.fresh = false;
    closeSheet('siteWrap');
    if (isOrig) { f.loaded = false; f.saved.code = ''; activate(f.key, true); toast('✓ گەڕایەوە بۆ ئۆریجینال'); }
    else { files = files.filter(x => x !== f); open = open.filter(k => k !== f.key); activeKey = open[0] || null; if (activeKey) activate(activeKey, true); else showEmpty(); toast('سڕایەوە'); }
  });
  const HTML_SKEL = `<!DOCTYPE html>
<html lang="ckb" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>پەڕەی نوێ | Kurd Technology</title>
<link rel="stylesheet" href="services.css">
</head>
<body>
  <h1 style="text-align:center;margin:40px 16px;">پەڕەی نوێ</h1>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="config.js"></script>
  <script src="site-code.js"></script>
</body>
</html>
`;
  function createSiteFile() {
    closeSheet('newWrap');
    const p = (prompt('ناوی فایل (ئینگلیزی) — نموونە: about.html  یان  js/app.js  یان  my.css') || '').trim();
    if (!p) return;
    if (!/^[A-Za-z0-9][A-Za-z0-9._\/-]{0,100}$/.test(p) || p.includes('..')) { toast('ناوی فایل دروست نییە', true); return; }
    if (PROTECTED.includes(p)) { toast('ئەم فایلە پارێزراوە', true); return; }
    const ex = byKey('s:' + p); if (ex) { activate(ex.key); return; }
    const f = makeSiteFile(p, null); f.loaded = true; f.fresh = true;
    f.doc.setValue(kindOfPath(p) === 'html' ? HTML_SKEL : ''); f.doc.clearHistory();
    files.push(f); closedGroups.delete(SITE); activate(f.key);
    toast('فایلی نوێ — Ctrl+S بۆ پاشەکەوت');
  }
  $('mUpload').addEventListener('click', () => $('uploadFile').click());
  $('uploadFile').addEventListener('change', async (e) => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    closeSheet('moreWrap');
    if (file.size > 1.5 * 1024 * 1024) { toast('فایلەکە لە ١.٥MB گەورەترە', true); return; }
    const p = (prompt('ناوی فایل لە سایتدا:', file.name.replace(/\s+/g, '-')) || '').trim();
    if (!p) return;
    if (!/^[A-Za-z0-9][A-Za-z0-9._\/-]{0,100}$/.test(p) || p.includes('..') || PROTECTED.includes(p)) { toast('ناوی فایل دروست نییە یان پارێزراوە', true); return; }
    const isText = TEXT_EXT.includes(extOf(p));
    let content;
    try {
      if (isText) content = await file.text();
      else content = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(file); });
    } catch (err) { toast('نەخوێنرایەوە', true); return; }
    const { data, error } = await sb.from('site_files').upsert({ path: p, content, encoding: isText ? 'text' : 'base64', mime: file.type || null, enabled: true }, { onConflict: 'path' }).select().single();
    if (error) { toast('نەتوانرا: ' + error.message, true); return; }
    overrides.set(p, data);
    files = files.filter(x => x.key !== 's:' + p);
    const f = makeSiteFile(p, data); files.push(f); closedGroups.delete(SITE);
    swPost({ type: 'sync' }); renderAll(); toast('✓ بارکرا و بۆ هەمووان چالاکە: /' + p);
  });

  // ---------- پێشبینین ----------
  function guessPage(path) {
    if (/\.html?$/i.test(path)) return path;
    const b = path.toLowerCase();
    if (b.startsWith('admin')) return 'admin.html';
    if (b.startsWith('cv-')) return 'cv-builder.html';
    if (b.startsWith('games')) return 'games.html';
    if (b.startsWith('student')) return 'student.html';
    if (b.startsWith('auth') || b.startsWith('style') || b.startsWith('device')) return 'index.html';
    return 'services.html';
  }
  function previewUrl(f) {
    if (f.site) { const g = guessPage(f.path); return g + '?preview=1&kf_pv=1'; }
    const p = f.page; let u;
    if (p === '*') u = 'services.html'; else if (p.startsWith('custom-')) u = 'custom.html?p=' + encodeURIComponent(p.slice(7));
    else u = p + '.html';
    return u + (u.includes('?') ? '&' : '?') + 'preview=1';
  }
  function pushPreviewData() {
    const rows = files.map(f => ({ id: f.id, name: f.name, page: f.page, kind: f.kind, target: f.target || null, code: f.doc.getValue(), enabled: f.enabled, sort_order: +f.sort_order || 0 }));
    try { localStorage.setItem('kurd_code_preview', JSON.stringify({ t: Date.now(), rows })); } catch (e) { toast('پێشبینین کار ناکات (localStorage)', true); }
  }
  let prevShown = '', swPrevSent = false;
  async function pushSwPreview() {
    const m = {};
    files.forEach(f => { if (f.site && f.loaded && !f.readonly && isDirty(f)) m[f.path] = { path: f.path, content: f.doc.getValue(), encoding: 'text', mime: null }; });
    if (!Object.keys(m).length && !swPrevSent) return;
    swPrevSent = Object.keys(m).length > 0;
    await swPost({ type: 'preview', files: m }, 1200);
  }
  async function refreshPreview(force) {
    const f = cur(); if (!f) return;
    pushPreviewData();
    await pushSwPreview();
    const url = previewUrl(f);
    $('prevUrl').textContent = url.replace(/[?&]preview=1/, '');
    if (force) clearConsole();
    if (prevShown !== url) { prevShown = url; $('frame').src = url; }
    else { try { $('frame').contentWindow.location.reload(); } catch (e) { $('frame').src = url; } }
  }
  function togglePreview(forceOpen) {
    const p = $('prev'); const on = forceOpen ? true : !p.classList.contains('open');
    p.classList.toggle('open', on);
    if (on) refreshPreview(true); else { $('frame').src = 'about:blank'; prevShown = ''; }
    setTimeout(() => cm.refresh(), 50);
  }
  $('btnPreview').addEventListener('click', () => togglePreview());
  $('btnPrevClose').addEventListener('click', () => togglePreview());
  $('btnPrevReload').addEventListener('click', () => { prevShown = ''; refreshPreview(true); });
  // Console
  let errCount = 0;
  function clearConsole() { $('conBody').innerHTML = ''; errCount = 0; $('conCount').textContent = ''; }
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || !e.data.kurdConsole) return;
    const d = document.createElement('div'); d.className = 'cl ' + (e.data.level || 'log'); d.textContent = e.data.text;
    $('conBody').appendChild(d); $('conBody').scrollTop = 1e9;
    if (e.data.level === 'error') { errCount++; $('conCount').textContent = '(' + errCount + ' هەڵە)'; $('console').classList.remove('collapsed'); }
  });
  $('conClear').addEventListener('click', (e) => { e.stopPropagation(); clearConsole(); });
  document.querySelector('.console-head').addEventListener('click', () => $('console').classList.toggle('collapsed'));

  // ---------- لایەنی لاوەکی ----------
  function openSide() { $('side').classList.add('open'); $('sideShade').classList.add('open'); }
  function closeSide() { $('side').classList.remove('open'); $('sideShade').classList.remove('open'); }
  function openSheet(id) { $(id).classList.add('open'); }
  function closeSheet(id) { $(id).classList.remove('open'); }
  document.querySelectorAll('.sheet-wrap').forEach(w => w.addEventListener('click', (e) => { if (e.target === w) w.classList.remove('open'); }));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeSheet(b.dataset.close)));

  $('btnTree').addEventListener('click', openSide);
  $('sideShade').addEventListener('click', closeSide);
  $('tree').addEventListener('click', (e) => {
    const fl = e.target.closest('.file'); if (fl) { activate(fl.dataset.k); return; }
    const gh = e.target.closest('.gh'); if (gh) {
      const p = gh.parentElement.dataset.p; closedGroups.has(p) ? closedGroups.delete(p) : closedGroups.add(p); renderTree();
    }
  });
  $('tabs').addEventListener('click', (e) => {
    const x = e.target.closest('[data-x]'); if (x) { e.stopPropagation(); closeTab(x.dataset.x); return; }
    const t = e.target.closest('.tab'); if (t) activate(t.dataset.k);
  });
  $('tabs').addEventListener('auxclick', (e) => { const t = e.target.closest('.tab'); if (t && e.button === 1) closeTab(t.dataset.k); });
  $('fileSearch').addEventListener('input', renderTree);

  $('btnNew').addEventListener('click', openNew);
  $('btnNew2').addEventListener('click', openNew);
  $('btnReload').addEventListener('click', () => {
    if (files.some(isDirty) && !confirm('هەندێک گۆڕانکاری پاشەکەوت نەکراون. نوێکردنەوە ئەوانە لەناو دەبات. بەردەوام؟')) return;
    files = []; open = []; activeKey = null; load(false);
  });
  $('btnSave').addEventListener('click', save);
  $('btnProps').addEventListener('click', openProps);
  $('btnUndo').addEventListener('click', () => cm.undo());
  $('btnRedo').addEventListener('click', () => cm.redo());
  $('btnFind').addEventListener('click', () => { cm.focus(); cm.execCommand('findPersistent'); });
  $('btnMore').addEventListener('click', () => openSheet('moreWrap'));
  $('btnSafeInfo').addEventListener('click', () => { closeSide(); openSheet('helpWrap'); });

  // مینیو
  $('mSaveAll').addEventListener('click', () => { closeSheet('moreWrap'); saveAll(); });
  $('mWrap').addEventListener('click', () => { cm.setOption('lineWrapping', !cm.getOption('lineWrapping')); closeSheet('moreWrap'); });
  let fs = +(localStorage.getItem('kc_fs') || 14);
  const applyFs = () => { document.documentElement.style.setProperty('--fs', fs + 'px'); try { localStorage.setItem('kc_fs', fs); } catch (e) {} cm.refresh(); };
  applyFs();
  $('mFontUp').addEventListener('click', () => { fs = Math.min(26, fs + 1); applyFs(); });
  $('mFontDown').addEventListener('click', () => { fs = Math.max(10, fs - 1); applyFs(); });
  $('mFoldAll').addEventListener('click', () => { cm.execCommand('foldAll'); closeSheet('moreWrap'); });
  $('mUnfoldAll').addEventListener('click', () => { cm.execCommand('unfoldAll'); closeSheet('moreWrap'); });
  $('mExport').addEventListener('click', () => {
    const rows = files.filter(f => f.id && !f.site).map(f => ({ name: f.name, page: f.page, kind: f.kind, target: f.target || null, code: f.saved.code, enabled: f.enabled, sort_order: f.sort_order }));
    const siteFiles = [...overrides.values()].map(r => ({ path: r.path, content: r.content, encoding: r.encoding, mime: r.mime }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ kurdCode: 1, rows, siteFiles }, null, 2)], { type: 'application/json' }));
    a.download = 'kurd-code-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
    closeSheet('moreWrap'); toast('بەکئەپ دابەزی');
  });
  $('mImport').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    try {
      const j = JSON.parse(await file.text()); if (!Array.isArray(j.rows) && !Array.isArray(j.siteFiles)) throw new Error('فایلەکە دروست نییە');
      j.rows = j.rows || [];
      let sn = 0;
      (j.siteFiles || []).forEach(r => {
        if (!r || !r.path || r.encoding === 'base64' || PROTECTED.includes(r.path)) return;
        let f = byKey('s:' + r.path);
        if (!f) { f = makeSiteFile(r.path, null); f.fresh = true; files.push(f); }
        f.loaded = true; f.doc.setValue(r.content || ''); sn++;
      });
      if (sn) toast(sn + ' فایلی سایت هێنرا (پاشەکەوتیان بکە)');
      j.rows.forEach(r => { const f = makeFile({ name: r.name, page: r.page, kind: ['js', 'css', 'html'].includes(r.kind) ? r.kind : 'js', code: r.code, enabled: false, target: r.target, sort_order: r.sort_order }); f.saved = { code: '', meta: '' }; files.push(f); });
      closeSheet('moreWrap'); renderAll(); toast(j.rows.length + ' فایل هێنرا (ناچالاکن، پاشەکەوتیان بکە و چالاکیان بکە)');
    } catch (err) { toast('هەڵە: ' + err.message, true); }
  });

  // کیبۆردی زیادە (مۆبایل)
  $('xkeys').addEventListener('mousedown', (e) => e.preventDefault());
  $('xkeys').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.i != null) { cm.replaceSelection(b.dataset.i, 'end'); }
    else if (b.dataset.k === 'tab') cm.replaceSelection('  ', 'end');
    else if (b.dataset.k === 'undo') cm.undo();
    else if (b.dataset.k === 'redo') cm.redo();
    else if (b.dataset.k === 'comment') cm.execCommand('toggleComment');
    else if (b.dataset.k === 'hint') cm.execCommand('autocomplete');
    cm.focus();
  });
  cm.on('inputRead', (c, ch) => { // تەواوکردنی خۆکار لە CSS/HTML دوای نووسینی پیتێک
    if (!/[a-zA-Z<]/.test(ch.text[0] || '') || c.state.completionActive) return;
    const f = cur(); if (!f || f.kind === 'js') return;
    c.showHint({ completeSingle: false });
  });

  // ئاگادارکردنەوە پێش دەرچوون
  window.addEventListener('beforeunload', (e) => { if (files.some(isDirty)) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } });

  const ok = await load(false);
  if (!ok) return;
  if (!files.length) openNew();
  else if (window.innerWidth <= 820 && !activeKey) openSide();
  else if (!activeKey && files[0]) activate(files[0].key, true);
});
