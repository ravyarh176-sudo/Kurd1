// Kurd Technology — AI Store Builder, Phase 2.
// Login/session comes from guard.js. AI calls go to /.netlify/functions/generate
// (the Gemini key lives only on Netlify). Nothing is published from here.

(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const state = { spec: null, html: null, title: '', busy: false, projectId: null };

  let toastT;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2000);
  }

  function addMsg(text, who, withBtn) {
    const d = document.createElement('div');
    d.className = 'm ' + who;
    d.textContent = text;
    if (withBtn) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'بینینی وێب سایت';
      b.addEventListener('click', () => setTab('view'));
      d.appendChild(b);
    }
    $('msgs').appendChild(d);
    d.scrollIntoView({ block: 'end', behavior: 'smooth' });
    return d;
  }
  function typing() {
    const d = addMsg('', 'ai');
    d.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    return d;
  }

  function setTab(name) {
    const view = name === 'view';
    $('tabChat').classList.toggle('on', !view);
    $('tabView').classList.toggle('on', view);
    $('paneChat').hidden = view;
    $('paneView').hidden = !view;
    $('dock').hidden = view;
  }
  function showChat() {
    $('home').hidden = true;
    $('chat').hidden = false;
    setTab('chat');
    window.scrollTo(0, 0);
  }

  // ---------- preview (built from the server-cleaned spec; all text escaped) ----------
  function buildPage(s) {
    const dark = s.theme === 'dark';
    const bg = dark ? '#0f1115' : '#f6f7f9', fg = dark ? '#f2f3f5' : '#14161a', card = dark ? '#1a1d24' : '#ffffff';
    const items = s.products.map((p) =>
      `<div class="c"><div class="im"></div><h3>${esc(p.name)}</h3><small>${esc(p.description)}</small><p>${esc(p.price)} ${esc(s.currency)}</p><button>زیادکردن بۆ سەبەتە</button></div>`
    ).join('');
    return `<!DOCTYPE html><html lang="ckb" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box;margin:0}
body{background:${bg};color:${fg};font-family:Tahoma,Arial,sans-serif;font-size:${16 * s.fontScale}px;line-height:1.7}
header{background:${s.headerColor};color:#fff;padding:16px;display:flex;justify-content:space-between;font-weight:700}
.hero{padding:30px 16px;text-align:center}.hero p{opacity:.75;margin-top:6px;font-size:.9em}
.g{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 12px 28px}
.c{background:${card};border-radius:14px;padding:10px;box-shadow:0 2px 10px rgba(0,0,0,.15)}
.im{height:90px;border-radius:10px;background:linear-gradient(135deg,${s.accent},${s.accent}33);margin-bottom:8px}
.c h3{font-size:1em}.c small{display:block;opacity:.65;font-size:.78em}.c p{margin:4px 0 8px;font-weight:700}
.c button{width:100%;border:0;border-radius:10px;padding:8px;background:${s.accent};color:#fff;font:inherit;font-size:.85em}
</style></head><body>
<header><span>${esc(s.storeName)}</span><span>سەبەتە (0)</span></header>
<div class="hero"><h2>${esc(s.storeName)}</h2><p>${esc(s.tagline)}</p></div>
<div class="g">${items}</div></body></html>`;
  }
  // Real generated sites run in a sandbox WITHOUT same-origin, and this CSP blocks every network request.
  const CSP = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; font-src data:; form-action \'none\'">';
  const wrapHtml = (h) => (/<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, (m) => m + CSP) : CSP + h);
  function renderPreview() {
    const f = $('frame');
    f.srcdoc = state.html ? wrapHtml(state.html) : buildPage(state.spec);
    f.hidden = false;
    $('viewEmpty').hidden = true;
  }

  // ---------- talking to our Netlify Function ----------
  async function accessToken() {
    let sb = window.kurdtechSupabase;
    if (!sb && window.supabase) sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    const { data } = await sb.auth.getSession();
    return data && data.session ? data.session.access_token : null;
  }
  async function callAI(prompt) {
    const t = await accessToken();
    if (!t) throw new Error('تکایە دووبارە بچۆ ژوورەوە.');
    for (let attempt = 0; attempt < 3; attempt++) {
      let r = null, d = {};
      try {
        r = await fetch('/.netlify/functions/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
          body: JSON.stringify({ prompt, spec: state.spec })
        });
        d = await r.json();
      } catch { d = { retryable: true, conn: true }; } // network error or Netlify timeout page
      if (r && r.ok && !d.conn) return d;
      if (d.retryable && attempt < 2) { await new Promise((ok) => setTimeout(ok, 1200)); continue; } // temporary → try again quietly
      throw new Error(d.conn ? 'پەیوەندی بە سێرڤەرەوە نەکرا یان کاتەکە تەواو بوو. دووبارە تاقی بکەرەوە.'
        : (d.message || 'هەڵەیەک ڕوویدا.') + (d.detail ? ' [' + d.detail + ']' : ''));
    }
  }

  async function run(text) {
    if (state.busy) return toast('چاوەڕێ بکە...');
    state.busy = true;
    setBusy(true);
    $('dock').querySelector('.send').disabled = true;
    const wait = typing();
    const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const creating = !state.html && !state.spec;
    try {
      const sb = sbc();
      const ins = await sb.from('ai_jobs').insert({ kind: creating ? 'create' : 'edit', prompt: text, base_html: state.html || null }).select('id').single();
      if (ins.error) throw new Error('نەتوانرا داواکارییەکە تۆمار بکرێت. SQL ی phase2d Run کراوە؟');
      const id = ins.data.id;
      const tk = await accessToken();
      if (!tk) throw new Error('تکایە دووبارە بچۆ ژوورەوە.');
      const r = await fetch('/.netlify/functions/build-background', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk }, body: JSON.stringify({ jobId: id })
      });
      if (r.status !== 202 && !r.ok) throw new Error('فەنکشنی build-background نەدۆزرایەوە (' + r.status + '). فایلەکە لە GitHub دانراوە؟');

      const t0 = Date.now();
      const steps = [[0, 'تێدەگەم لە داواکارییەکەت...'], [8, 'دیزاینەکە دەکێشم...'], [22, 'کۆدی وێبەکە دەنووسم...'], [50, 'دوایین چاکسازییەکان...']];
      for (;;) {
        await sleep(2500);
        const secs = Math.round((Date.now() - t0) / 1000);
        const step = steps.filter((x) => secs >= x[0]).pop()[1];
        wait.textContent = step + ' (' + secs + ' چرکە)';
        if (secs > 270) throw new Error('کاتەکە زۆر برد. دووبارە تاقی بکەرەوە.');
        const q = await sb.from('ai_jobs').select('status,error').eq('id', id).single();
        if (q.error) continue;
        if (q.data.status === 'failed') { await sb.from('ai_jobs').delete().eq('id', id); throw new Error(q.data.error || 'هەڵەیەک ڕوویدا.'); }
        if (q.data.status === 'done') {
          const g = await sb.from('ai_jobs').select('html').eq('id', id).single();
          if (g.error || !g.data.html) throw new Error('وێبەکە نەخوێندرایەوە. دووبارە تاقی بکەرەوە.');
          state.html = g.data.html; state.spec = null;
          state.title = ((state.html.match(/<title>([^<]{1,60})/i) || [])[1] || text).slice(0, 60);
          await sb.from('ai_jobs').delete().eq('id', id);
          break;
        }
      }
      renderPreview();
      await saveProject();
      wait.remove();
      addMsg((creating ? 'وێبەکەت دروست کرا ✨' : 'گۆڕانکارییەکە ئەنجام درا ✓') +
        (creating ? '\nبۆ نموونە بنووسە: «هێدەرەکە شین بکە»، «ڕەنگەکان گەرمتر بکە» یان «بەشی پەیوەندی زیاد بکە».' : ''), 'ai', true);
    } catch (e) {
      wait.remove();
      addMsg('⚠️ ' + e.message, 'ai');
    } finally {
      state.busy = false;
      setBusy(false);
      $('dock').querySelector('.send').disabled = false;
    }
  }

    // ---------- flows ----------
  function submitHome() {
    const text = $('prompt').value.trim();
    const err = $('homeErr');
    if (text.length < 5) {
      err.textContent = 'تکایە وەسفێکی درێژتر بنووسە (کەمتر نییە لە ٥ پیت).';
      err.hidden = false;
      return;
    }
    err.hidden = true;
    showChat();
    addMsg('سڵاو! من ئەی ئای ستۆر بیڵدەرم. زۆر بەخۆشحاڵییەوە یارمەتیت دەدەم بۆ دروستکردنی وێب سایتەکەت.', 'ai');
    addMsg(text, 'me');
    run(text);
  }
  function submitChat(e) {
    e.preventDefault();
    const inp = $('msgInput');
    const text = inp.value.trim();
    if (!text || state.busy) return;
    inp.value = '';
    addMsg(text, 'me');
    run(text);
  }

  // ---------- saved projects (each user sees only their own; RLS enforces it) ----------
  function fix(s) {
    s = s || {};
    const hx = (v, d) => (/^#[0-9a-fA-F]{6}$/.test(v) ? v : d);
    const a = hx(s.accent, '#16a34a');
    return {
      storeName: String(s.storeName || 'فرۆشگاکەم').slice(0, 50), tagline: String(s.tagline || '').slice(0, 120),
      theme: s.theme === 'light' ? 'light' : 'dark', accent: a, headerColor: hx(s.headerColor, a),
      fontScale: Math.min(1.4, Math.max(0.8, Number(s.fontScale) || 1)), currency: String(s.currency || '$').slice(0, 4),
      products: (Array.isArray(s.products) ? s.products.slice(0, 8) : []).map((p) => ({
        name: String((p && p.name) || '').slice(0, 60), description: String((p && p.description) || '').slice(0, 160), price: Number(p && p.price) || 0 }))
    };
  }
  async function saveProject() {
    const sb = sbc();
    const spec = state.html ? { html: state.html } : state.spec;
    const title = state.title || (state.spec && state.spec.storeName) || 'وێب';
    const res = state.projectId
      ? await sb.from('ai_projects').update({ title, spec, updated_at: new Date().toISOString() }).eq('id', state.projectId)
      : await sb.from('ai_projects').insert({ title, spec }).select('id').single();
    if (res.error) return toast('پڕۆژەکە پاشەکەوت نەکرا');
    if (!state.projectId && res.data) state.projectId = res.data.id;
  }
  async function loadProjects() {
    const { data, error } = await sbc().from('ai_projects').select('id,title,spec,updated_at')
      .order('updated_at', { ascending: false }).limit(20);
    const grid = $('projGrid');
    grid.textContent = '';
    if (error || !data || !data.length) { $('projSection').hidden = true; return; } // nothing yet → section stays hidden
    data.forEach((p) => {
      const s = fix(p.spec);
      const c = document.createElement('article');
      c.className = 'card';
      c.innerHTML = `<div class="thc" style="background:linear-gradient(135deg,${s.headerColor},${s.accent})"><span>${esc(p.title)}</span></div><h3>${esc(p.title)}</h3><small class="mut">${esc(new Date(p.updated_at).toLocaleDateString('ckb'))}</small><div class="crow"><button class="pill" type="button">بینین</button><button class="del" type="button">سڕینەوە</button></div>`;
      c.querySelector('.pill').addEventListener('click', () => openProject(p, s));
      c.querySelector('.del').addEventListener('click', async () => {
        if (!confirm('دڵنیایت لە سڕینەوەی ئەم پڕۆژەیە؟')) return;
        const r = await sbc().from('ai_projects').delete().eq('id', p.id);
        if (r.error) toast('نەسڕایەوە'); else loadProjects();
      });
      grid.appendChild(c);
    });
    $('projSection').hidden = false;
  }
  function openProject(p, s) {
    const h = p.spec && p.spec.html ? String(p.spec.html).slice(0, 200000) : null;
    state.html = h; state.spec = h ? null : s; state.projectId = p.id; state.title = p.title;
    $('msgs').textContent = '';
    showChat();
    addMsg('پڕۆژەی «' + p.title + '» کرایەوە. دەتوانیت داوای گۆڕانکاری بکەیت.', 'ai');
    renderPreview();
    setTab('view');
  }
  function goHome() {
    state.spec = null; state.html = null; state.title = ''; state.projectId = null;
    $('msgs').textContent = ''; $('prompt').value = '';
    $('frame').hidden = true; $('frame').srcdoc = ''; $('viewEmpty').hidden = false;
    $('chat').hidden = true; $('home').hidden = false;
    loadProjects();
  }

  // ---------- presence (who is online / generating) ----------
  const sbc = () => window.kurdtechSupabase || (window.supabase && window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY));
  let ch = null;
  async function joinPresence() {
    const sb = sbc();
    const { data } = await sb.auth.getSession();
    const uid = data && data.session && data.session.user.id;
    if (!uid) return;
    ch = sb.channel('ai-builder-online', { config: { presence: { key: uid } } });
    ch.on('presence', { event: 'sync' }, () => { if (!$('admin').hidden) renderLive(); });
    ch.subscribe((s) => { if (s === 'SUBSCRIBED') ch.track({ busy: false }); });
  }
  function setBusy(b) { if (ch) ch.track({ busy: b }); }
  function renderLive() {
    const st = ch ? ch.presenceState() : {};
    const ids = Object.keys(st);
    $('stOnline').textContent = ids.length;
    $('stBusy').textContent = ids.filter((k) => st[k].some((m) => m.busy)).length;
  }

  // ---------- admin panel (UI only; real checks are in RLS + the Function) ----------
  let prevView = 'home';
  function openAdmin() {
    prevView = $('chat').hidden ? 'home' : 'chat';
    $('home').hidden = true; $('chat').hidden = true; $('admin').hidden = false;
    renderLive(); loadAdmin();
  }
  function closeAdmin() { $('admin').hidden = true; $(prevView).hidden = false; }

  async function loadAdmin() {
    const sb = sbc();
    const [u, s] = await Promise.all([
      sb.rpc('ai_admin_users'),
      sb.from('ai_settings').select('daily_limit,max_sites').eq('id', 1).maybeSingle()
    ]);
    const box = $('adUsers');
    if (u.error) { box.innerHTML = '<div class="err">هەڵە: ' + esc(u.error.message) + '</div>'; return; }
    const rows = u.data || [];
    $('stUsers').textContent = rows.filter((r) => Number(r.requests) > 0).length;
    $('stReq').textContent = rows.reduce((a, r) => a + Number(r.requests), 0);
    if (s.data) { $('setSites').value = s.data.max_sites; $('setDaily').value = s.data.daily_limit; }
    box.textContent = '';
    rows.forEach((r) => {
      const d = document.createElement('div');
      d.className = 'urow';
      d.innerHTML = `<button type="button" class="uhead"><b>${esc(r.full_name || '—')}</b><small>${esc(r.email || '')}</small><span>${esc(r.requests)} داواکاری • ${esc(r.sites)} وێب</span></button><div class="ureqs" hidden></div>`;
      d.querySelector('.uhead').addEventListener('click', () => toggleReqs(d, r.user_id));
      box.appendChild(d);
    });
  }
  async function toggleReqs(row, uid) {
    const box = row.querySelector('.ureqs');
    box.hidden = !box.hidden;
    if (box.hidden || box.dataset.loaded) return;
    box.dataset.loaded = '1';
    const { data, error } = await sbc().from('ai_requests')
      .select('kind,prompt,status,flag,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(30);
    if (error) { box.textContent = error.message; return; }
    box.innerHTML = (data || []).map((q) =>
      `<div class="rq"><i class="f-${esc(q.flag)}"></i><p>${esc(q.prompt)}</p><small>${q.kind === 'create' ? 'دروستکردن' : 'دەستکاری'} • ${q.status === 'completed' ? 'تەواو' : 'سەرکەوتوو نەبوو'} • ${new Date(q.created_at).toLocaleString('ckb')}</small></div>`
    ).join('') || '<small>هیچ داواکارییەک نییە.</small>';
  }
  async function initAdmin() {
    const { data } = await sbc().rpc('is_ai_admin');
    if (data !== true) return;
    $('adminBtn').hidden = false;
    $('adminBtn').addEventListener('click', () => ($('admin').hidden ? openAdmin() : closeAdmin()));
    $('setSave').addEventListener('click', async () => {
      const m = parseInt($('setSites').value, 10), dl = parseInt($('setDaily').value, 10);
      if (!(m >= 0 && m <= 100 && dl >= 1 && dl <= 500)) return toast('ژمارەکان دروست نین');
      const { error } = await sbc().from('ai_settings').update({ max_sites: m, daily_limit: dl }).eq('id', 1);
      toast(error ? 'هەڵە: ' + error.message : 'پاشەکەوت کرا ✓');
    });
  }

  $('sendBtn').addEventListener('click', submitHome);
  $('newBtn').addEventListener('click', goHome);
  $('dock').addEventListener('submit', submitChat);
  $('tabChat').addEventListener('click', () => setTab('chat'));
  $('tabView').addEventListener('click', () => setTab('view'));
  document.querySelectorAll('[data-fill]').forEach((b) =>
    b.addEventListener('click', () => { $('prompt').value = b.dataset.fill; $('prompt').focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); })
  );
  document.querySelectorAll('[data-soon]').forEach((b) =>
    b.addEventListener('click', () => toast('ئەم تایبەتمەندییە بەم زووانە دێت 🚀'))
  );
  window.addEventListener('kurdtech:ready', () => {
    $('who').textContent = (window.kurdtechProfile && window.kurdtechProfile.full_name) || '';
    joinPresence();
    loadProjects();
    initAdmin();
  });
})();
