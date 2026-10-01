// Kurd Technology — AI Store Builder, Phase 2.
// Login/session comes from guard.js. AI calls go to /.netlify/functions/generate
// (the Gemini key lives only on Netlify). Nothing is published from here.

(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const state = { spec: null, busy: false };

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
  function renderPreview() {
    const f = $('frame');
    f.srcdoc = buildPage(state.spec); // sandbox="" → no scripts, no network
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
    let r, d;
    try {
      r = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify({ prompt, spec: state.spec })
      });
      d = await r.json();
    } catch { throw new Error('پەیوەندی بە سێرڤەرەوە نەکرا. ئینتەرنێتەکەت بپشکنە.'); }
    if (!r.ok) throw new Error(d.message || 'هەڵەیەک ڕوویدا.');
    return d;
  }

  async function run(text) {
    if (state.busy) return toast('چاوەڕێ بکە...');
    state.busy = true;
    $('dock').querySelector('.send').disabled = true;
    const wait = typing();
    const creating = !state.spec;
    try {
      const d = await callAI(text);
      state.spec = d.spec;
      renderPreview();
      wait.remove();
      addMsg((creating ? 'وێبەکەت دروست کرا.' : 'گۆڕانکارییەکە ئەنجام درا.') +
        `\nئەمڕۆ ${d.remaining} داواکاریت ماوە.` +
        (creating ? '\nبۆ نموونە بنووسە: «هێدەرەکە شین بکە» یان «فۆنتەکە گەورەتر بکە».' : ''), 'ai', true);
    } catch (e) {
      wait.remove();
      addMsg('⚠️ ' + e.message, 'ai');
    } finally {
      state.busy = false;
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

  $('sendBtn').addEventListener('click', submitHome);
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
  });
})();
