// Kurd Technology — بارکردنی «کۆدی زیادە» (site_code) لە داتابەیسەوە + «فایلەکانی سایت» (site_files) لە ڕێگەی sw.js.
// دەبێت دوای guard.js و دوای هەموو سکریپتەکانی تر بار بکرێت.
// ئەگەر کۆدێک سایتەکەی تێکدا: ?safe=1 لە کۆتایی ئەدرەس زیاد بکە بۆ ناچالاککردنیان.
// ئەگەر Service Worker کێشەی دروست کرد: ?nosw=1 لە کۆتایی ئەدرەس زیاد بکە بۆ لابردنی.

// ---------- Service Worker (جێگرتنەوەی فایلەکانی GitHub بە فایلەکانی ئیدیتۆر) ----------
(function () {
  try {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    if (/[?&]nosw=1/.test(location.search)) {
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
      return;
    }
    const wasControlled = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    const here = (location.pathname.replace(/^\/+/, '') || 'index.html');
    // یەکەم سەردان: دوای چالاکبوونی SW، ئەگەر ئەم پەڕەیە جێگرەوەی هەبوو، یەکجار نوێی بکەرەوە
    if (!wasControlled && !/editor\.html$/.test(here) && !/[?&](safe|preview)=1/.test(location.search)) {
      navigator.serviceWorker.ready.then(reg => {
        const w = reg.active; if (!w) return;
        const ch = new MessageChannel();
        ch.port1.onmessage = (m) => {
          let done = false; try { done = sessionStorage.getItem('kf_swr') === here; } catch (e) {}
          if (m.data && m.data.has && !done) { try { sessionStorage.setItem('kf_swr', here); } catch (e) {} location.reload(); }
        };
        w.postMessage({ type: 'has', path: here.replace(/[?#].*$/, '') }, [ch.port2]);
      }).catch(() => {});
    }
  } catch (e) {}
})();

(function () {
  if (/[?&]safe=1/.test(location.search)) return;

  let page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/i, '').toLowerCase() || 'index';
  if (page === 'editor') return; // ئیدیتۆری کۆد هەرگیز کۆدی زیادە بار ناکات (دڵنیایی، تا هەمیشە بتوانی چاکی بکەیتەوە)
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

  // دۆخی پێشبینین: ئیدیتۆر کۆدە پاشەکەوتنەکراوەکان لە localStorage دەنێرێت (تەنها لەو ئامێرەی خۆت)
  const PREVIEW = /[?&]preview=1/.test(location.search) && window.parent !== window;
  if (PREVIEW) {
    const send = (level, args) => {
      try { window.parent.postMessage({ kurdConsole: true, level, text: args.map(a => { try { return typeof a === 'string' ? a : (a && a.stack) || JSON.stringify(a); } catch (e) { return String(a); } }).join(' ') }, location.origin); } catch (e) {}
    };
    ['log', 'warn', 'error', 'info'].forEach(l => {
      const o = console[l].bind(console);
      console[l] = (...a) => { send(l, a); o(...a); };
    });
    window.addEventListener('error', e => send('error', [(e.message || 'Error') + (e.lineno ? ' (line ' + e.lineno + ')' : '')]));
    window.addEventListener('unhandledrejection', e => send('error', ['Promise: ' + (e.reason && e.reason.message || e.reason)]));
  }

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
    if (PREVIEW) {
      try {
        const d = JSON.parse(localStorage.getItem('kurd_code_preview') || '{}');
        rows = (d.rows || []).filter(r => r.enabled !== false && (r.page === '*' || (r.page || '').toLowerCase() === page))
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      } catch (e) { console.warn('[site-code] preview:', e.message); }
    } else try {
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
