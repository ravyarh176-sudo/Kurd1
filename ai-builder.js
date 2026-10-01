// Kurd Technology — AI Store Builder (Phase 1: UI + saved projects + server-side daily limit).
// Login is reused from guard.js. AI runs through the Cloudflare Worker (Gemini key never reaches the browser).
const WORKER_URL = 'PUT_YOUR_WORKER_URL_HERE'; // e.g. https://kurd-ai.YOURNAME.workers.dev
window.addEventListener('kurdtech:ready', async () => {
  const sb = window.kurdtechSupabase, user = window.kurdtechUser, profile = window.kurdtechProfile;
  const $ = (id) => document.getElementById(id);
  const ADMIN_EMAIL = 'ravyarhasan023@gmail.com'; // UI hint only; real check is ai_is_admin() in the database
  const isAdmin = profile.role === 'owner' && user.email === ADMIN_EMAIL;
  let cur = null; // current project {id, meta, html}

  const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2400); }
  function errText(e) {
    const m = (e && e.message) || '';
    if (m.includes('limit_reached')) return 'سنووری ڕۆژانەت تەواو بووە. سبەینێ دووبارە هەوڵ بدەرەوە.';
    if (m.includes('busy')) return 'AI ئێستا قەرەباڵغە، دوای چەند چرکەیەک دووبارە هەوڵ بدەرەوە.';
    if (m.includes('unsafe') || m.includes('bad_output')) return 'ئەنجامەکە پشکنینی ئاسایشی نەبڕی، داواکارییەکەت بگۆڕە و دووبارە هەوڵ بدەرەوە.';
    return 'هەڵەیەک ڕوویدا، دووبارە هەوڵ بدەرەوە.';
  }

  async function callAI(body) {
    const { data: { session } } = await sb.auth.getSession();
    const r = await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'server');
    return j;
  }

  // ---------- UI helpers ----------
  function addMsg(text, who, cls) { const d = document.createElement('div'); d.className = 'm ' + who + (cls ? ' ' + cls : ''); d.textContent = text; $('msgs').appendChild(d); d.scrollIntoView({ block: 'end' }); }
  function show(view) { $('home').hidden = view !== 'home'; $('work').hidden = view !== 'work'; document.querySelector('.bar').style.display = view === 'work' ? 'flex' : 'none'; }
  function tab(t) { document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $('paneChat').hidden = t !== 'chat'; $('paneView').hidden = t !== 'view'; }
  function render() { $('frame').srcdoc = cur.html || ''; }
  async function loadQuota() {
    const { data } = await sb.rpc('ai_quota');
    if (data) $('quota').textContent = `${data.used}/${data.daily_limit} ئەمڕۆ`;
  }

  async function loadProjects() {
    const { data, error } = await sb.from('ai_projects').select('id,title,meta,html,created_at').eq('user_id', user.id).neq('status', 'removed').order('created_at', { ascending: false });
    const box = $('projects');
    if (error || !data || !data.length) { box.innerHTML = '<div class="empty">هێشتا هیچ پڕۆژەیەکت نییە. یەکەمیان دروست بکە ☝️</div>'; return; }
    box.innerHTML = '';
    data.forEach(p => {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'pc';
      el.innerHTML = `<b>${esc(p.title)}</b><small>${new Date(p.created_at).toLocaleDateString('ckb-IQ')}</small>`;
      el.addEventListener('click', () => openProject(p));
      box.appendChild(el);
    });
  }
  function openProject(p) {
    cur = p; $('msgs').innerHTML = '';
    addMsg('سڵاو! پڕۆژەکەت کرایەوە. چی دەگۆڕیت؟ نموونە: «هێدەرەکە شین بکە»', 'a');
    show('work'); tab('view'); render();
  }

  // ---------- Generate ----------
  $('goBtn').addEventListener('click', async () => {
    const prompt = $('prompt').value.trim();
    if (prompt.length < 3) return toast('تکایە وەسفێک بنووسە.');
    $('goBtn').disabled = true;
    try {
      const { data: proj, error } = await sb.from('ai_projects').insert({ user_id: user.id, title: 'پڕۆژەی نوێ', prompt }).select().single();
      if (error) throw error;
      let ai;
      try { ai = await callAI({ project_id: proj.id, kind: 'generate', prompt }); }
      catch (e2) { await sb.from('ai_projects').delete().eq('id', proj.id); throw e2; }
      proj.html = ai.html; proj.title = ai.title;
      await sb.from('ai_projects').update({ html: ai.html, title: ai.title, updated_at: new Date().toISOString() }).eq('id', proj.id);
      cur = proj; $('msgs').innerHTML = '';
      addMsg(prompt, 'u'); addMsg('وێبەکەت ئامادەیە بۆ بڵاوکردنەوە. لە «بینینی ماڵپەڕ» ببینە، یان لێرە داوای گۆڕانکاری بکە.', 'a');
      show('work'); tab('view'); render(); $('prompt').value = ''; loadQuota();
    } catch (e) { toast(errText(e)); }
    $('goBtn').disabled = false;
  });

  // ---------- Edit ----------
  async function sendEdit() {
    const t = $('editInput').value.trim();
    if (t.length < 3 || !cur) return;
    $('sendBtn').disabled = true; addMsg(t, 'u'); $('editInput').value = '';
    try {
      const ai = await callAI({ project_id: cur.id, kind: 'edit', prompt: t, html: cur.html });
      cur.html = ai.html;
      await sb.from('ai_projects').update({ html: cur.html, updated_at: new Date().toISOString() }).eq('id', cur.id);
      addMsg('کرا ✅ لە «بینینی ماڵپەڕ» ببینە.', 'a'); render(); loadQuota();
    } catch (e) { addMsg(errText(e), 'a', 'err'); }
    $('sendBtn').disabled = false;
  }
  $('sendBtn').addEventListener('click', sendEdit);
  $('editInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendEdit(); });
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => tab(b.dataset.t)));
  $('homeBtn').addEventListener('click', () => { show('home'); loadProjects(); });

  // ---------- Admin sheet (UI; every write is enforced by RLS) ----------
  if (isAdmin) {
    $('adminBtn').hidden = false;
    $('adminBtn').addEventListener('click', async () => {
      $('adminOv').classList.add('open');
      const [{ data: s }, { data: users }, { data: reqs }] = await Promise.all([
        sb.from('ai_settings').select('daily_limit').eq('id', 1).single(),
        sb.from('profiles').select('id,full_name').order('created_at', { ascending: false }),
        sb.from('ai_requests').select('user_id,kind,prompt,created_at').order('created_at', { ascending: false }).limit(30)
      ]);
      if (s) $('globalLimit').value = s.daily_limit;
      const names = {}; (users || []).forEach(u => names[u.id] = u.full_name || 'بێ ناو');
      $('userSel').innerHTML = (users || []).map(u => `<option value="${u.id}">${esc(u.full_name || 'بێ ناو')}</option>`).join('');
      $('reqList').innerHTML = (reqs || []).map(r => `<div class="rq"><b>${esc(names[r.user_id] || '؟')}</b> <small>${r.kind} · ${new Date(r.created_at).toLocaleString('ckb-IQ')}</small><br>${esc(r.prompt)}</div>`).join('') || '<div class="empty">هیچ داواکارییەک نییە.</div>';
    });
    $('adminX').addEventListener('click', () => $('adminOv').classList.remove('open'));
    $('adminOv').addEventListener('click', e => { if (e.target.id === 'adminOv') $('adminOv').classList.remove('open'); });
    $('saveGlobal').addEventListener('click', async () => {
      const v = parseInt($('globalLimit').value, 10);
      const { error } = await sb.from('ai_settings').update({ daily_limit: v }).eq('id', 1);
      $('adminNote').textContent = error ? 'نەکرا.' : 'سنووری هەموو بەکارهێنەران پاشەکەوت کرا ✅';
    });
    $('saveUser').addEventListener('click', async () => {
      const v = parseInt($('userLimit').value, 10);
      const { error } = await sb.from('ai_user_limits').upsert({ user_id: $('userSel').value, daily_limit: v });
      $('adminNote').textContent = error ? 'نەکرا.' : 'سنووری ئەم بەکارهێنەرە پاشەکەوت کرا ✅';
    });
  }

  show('home'); loadQuota(); loadProjects();
});
