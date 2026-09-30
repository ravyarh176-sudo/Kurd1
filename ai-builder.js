// Kurd Technology — AI Store Builder, Phase 1.
// Login/session comes from guard.js (window.kurdtechUser / kurdtechProfile).
// Phase 1 uses a LOCAL preview generator. Gemini replaces it in Phase 2.
// Nothing here is published anywhere — the preview lives in a sandboxed iframe.

(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toLatin = (s) => s.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  const COLORS = [
    ['شین', '#2563eb'], ['سوور', '#dc2626'], ['سەوز', '#16a34a'], ['زەرد', '#eab308'],
    ['مۆر', '#7c3aed'], ['پرتەقاڵی', '#f97316'], ['پەمەیی', '#ec4899']
  ];

  const state = { made: false, desc: '', accent: '#16a34a', head: null, dark: true, scale: 1, count: 4 };

  // ---------- small helpers ----------
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

  // ---------- local preview generator (placeholder for Gemini) ----------
  function buildPage() {
    const bg = state.dark ? '#0f1115' : '#f6f7f9';
    const fg = state.dark ? '#f2f3f5' : '#14161a';
    const card = state.dark ? '#1a1d24' : '#ffffff';
    const head = state.head || state.accent;
    const items = Array.from({ length: state.count }, (_, i) =>
      `<div class="c"><div class="im"></div><h3>بەرهەمی ${i + 1}</h3><p>${25 + i * 5} $</p><button>زیادکردن بۆ سەبەتە</button></div>`
    ).join('');
    return `<!DOCTYPE html><html lang="ckb" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0}
body{background:${bg};color:${fg};font-family:Tahoma,Arial,sans-serif;font-size:${16 * state.scale}px;line-height:1.7}
header{background:${head};color:#fff;padding:16px;display:flex;justify-content:space-between;align-items:center;font-weight:700}
.hero{padding:34px 16px;text-align:center}
.hero p{opacity:.75;margin-top:6px;font-size:.9em}
.g{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 12px 28px}
.c{background:${card};border-radius:14px;padding:10px;box-shadow:0 2px 10px rgba(0,0,0,.15)}
.im{height:90px;border-radius:10px;background:linear-gradient(135deg,${state.accent},${state.accent}33);margin-bottom:8px}
.c h3{font-size:1em}.c p{opacity:.8;margin:2px 0 8px}
.c button{width:100%;border:0;border-radius:10px;padding:8px;background:${state.accent};color:#fff;font:inherit;font-size:.85em}
</style></head><body>
<header><span>فرۆشگاکەم</span><span>سەبەتە (0)</span></header>
<div class="hero"><h2>بەخێربێن بۆ فرۆشگاکەم</h2><p>${esc(state.desc.slice(0, 120))}</p></div>
<div class="g">${items}</div></body></html>`;
  }

  function renderPreview() {
    const f = $('frame');
    f.srcdoc = buildPage(); // sandbox="" → no scripts, no same-origin, no network side effects
    f.hidden = false;
    $('viewEmpty').hidden = true;
  }

  // ---------- reading the user's words ----------
  function detectCount(t) {
    const m = toLatin(t).match(/(\d{1,2})/);
    if (!m) return null;
    return Math.min(Math.max(parseInt(m[1], 10), 1), 8);
  }

  function generate(text) {
    state.made = true;
    state.desc = text;
    state.count = detectCount(text) || 4;
    if (/ڕووناک|رووناک|سپی/.test(text)) state.dark = false;
    if (/تاریک/.test(text)) state.dark = true;
    const c = COLORS.find(([w]) => text.includes(w));
    if (c) state.accent = c[1];
    renderPreview();
  }

  function edit(text) {
    const done = [];
    const isHead = /هێدەر|سەرەوە/.test(text);
    const c = COLORS.find(([w]) => text.includes(w));
    if (c) {
      if (isHead) { state.head = c[1]; done.push('ڕەنگی هێدەر گۆڕدرا'); }
      else { state.accent = c[1]; done.push('ڕەنگی سەرەکی گۆڕدرا'); }
    }
    if (/تاریک/.test(text)) { state.dark = true; done.push('دیزاینی تاریک'); }
    else if (/ڕووناک|رووناک|سپی/.test(text)) { state.dark = false; done.push('دیزاینی ڕووناک'); }
    if (/گەورە/.test(text)) { state.scale = Math.min(state.scale + 0.1, 1.4); done.push('فۆنت گەورەتر بوو'); }
    if (/بچووک/.test(text)) { state.scale = Math.max(state.scale - 0.1, 0.8); done.push('فۆنت بچووکتر بوو'); }
    const n = detectCount(text);
    if (n && /بەرهەم/.test(text)) { state.count = n; done.push('ژمارەی بەرهەمەکان: ' + n); }
    if (!done.length) return null;
    renderPreview();
    return done.join(' • ');
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
    startChat(text);
  }

  function startChat(text) {
    showChat();
    addMsg('سڵاو! من ئەی ئای ستۆر بیڵدەرم. زۆر بەخۆشحاڵییەوە یارمەتیت دەدەم بۆ دروستکردنی وێب سایتەکەت.', 'ai');
    addMsg(text, 'me');
    const wait = addMsg('', 'ai');
    wait.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    setTimeout(() => {
      generate(text);
      wait.remove();
      addMsg('وێبەکەت دروست کرا. دەتوانیت لێرە داوای گۆڕانکاری بکەیت، بۆ نموونە «هێدەرەکە شین بکە» یان «فۆنتەکە گەورەتر بکە».', 'ai', true);
    }, 900);
  }

  function submitChat(e) {
    e.preventDefault();
    const inp = $('msgInput');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    addMsg(text, 'me');
    if (!state.made) { generate(text); addMsg('وێبەکەت دروست کرا.', 'ai', true); return; }
    const result = edit(text);
    if (result) addMsg('ئەنجام درا: ' + result, 'ai', true);
    else addMsg('هێشتا ئەم جۆرە گۆڕانکارییە نازانم. لە فازی ٢ (Gemini) هەموو داواکارییەک دەتوانرێت. ئێستا: ڕەنگ، فۆنت، تاریک/ڕووناک و ژمارەی بەرهەم.', 'ai');
  }

  // ---------- wiring ----------
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

  // name in header, once guard.js has confirmed the session
  window.addEventListener('kurdtech:ready', () => {
    const p = window.kurdtechProfile || {};
    $('who').textContent = p.full_name || '';
  });
})();
