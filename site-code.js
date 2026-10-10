// Kurd Technology — بارکردنی «کۆدی زیادە» (site_code) لە داتابەیسەوە.
// دەبێت دوای guard.js و دوای هەموو سکریپتەکانی تر بار بکرێت.
// ئەگەر کۆدێک سایتەکەی تێکدا: ?safe=1 لە کۆتایی ئەدرەس زیاد بکە بۆ ناچالاککردنیان.
(function () {
  if (/[?&]safe=1/.test(location.search)) return;

  let page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/i, '').toLowerCase() || 'index';
  if (page === 'admin') return; // پانێڵی ئەدمین هەرگیز کۆدی زیادە بار ناکات (دڵنیایی)
  if (page === 'custom') {
    const p = new URLSearchParams(location.search).get('p') || '';
    page = 'custom-' + p.toLowerCase();
  }
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;

  // کلاینتی تایبەت بۆ خوێندنەوە (بێ سێشن، تەنها کۆدە چالاکەکان)
  const reader = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  window.KurdSite = { page };

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  function domReady() {
    return new Promise(r => {
      if (document.readyState !== 'loading') r();
      else document.addEventListener('DOMContentLoaded', r, { once: true });
    });
  }
  // لە پەڕەی چووارچێوەی guard، چاوەڕێ دەکات تا بەکارهێنەر دڵنیا ببێتەوە
  function appReady() {
    return new Promise(r => {
      if (!window.kurdtechSupabase || window.kurdtechUser) return r();
      let done = false;
      const go = () => { if (!done) { done = true; r(); } };
      window.addEventListener('kurdtech:ready', go, { once: true });
      setTimeout(go, 8000);
    });
  }

  function addCss(row) {
    const s = document.createElement('style');
    s.setAttribute('data-site-code', row.name);
    s.textContent = row.code;
    document.head.appendChild(s);
  }
  function addHtml(row) {
    let host = document.body;
    if (row.target && row.target.trim()) {
      try { host = document.querySelector(row.target.trim()) || document.body; } catch (e) {}
    } else if (page.startsWith('custom-')) {
      host = document.getElementById('app') || document.body;
    }
    const box = document.createElement('div');
    box.setAttribute('data-site-code', row.name);
    box.innerHTML = row.code;
    host.appendChild(box);
  }
  async function runJs(row) {
    try {
      const fn = new AsyncFunction('sb', 'user', 'profile', 'page', row.code);
      await fn(window.kurdtechSupabase || reader, window.kurdtechUser, window.kurdtechProfile, page);
    } catch (e) {
      console.error('[site-code] هەڵە لە «' + row.name + '»:', e);
    }
  }

  (async function () {
    let rows = [];
    try {
      const { data, error } = await reader.from('site_code')
        .select('id,name,page,kind,target,code,sort_order')
        .eq('enabled', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      rows = (data || []).filter(r => r.page === '*' || (r.page || '').toLowerCase() === page);
    } catch (e) { console.warn('[site-code] نەتوانرا بار بکرێت:', e.message || e); return; }
    if (!rows.length) return;

    await domReady();
    rows.filter(r => r.kind === 'css').forEach(r => { try { addCss(r); } catch (e) { console.error(e); } });
    rows.filter(r => r.kind === 'html').forEach(r => { try { addHtml(r); } catch (e) { console.error(e); } });
    await appReady();
    for (const r of rows.filter(r => r.kind === 'js')) await runJs(r);
  })();
})();
