// Kurd Technology — ناسنامەی ئامێر (Device lock)
// دەبێت پێش guard.js و auth.js بار بکرێت.
(function () {
  const KEY = 'kt_device_id';

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'd-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 14);
  }
  function readCookie() {
    const m = document.cookie.match(/(?:^|;\s*)kt_did=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function writeCookie(v) {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = 'kt_did=' + encodeURIComponent(v) + '; max-age=315360000; path=/; SameSite=Lax' + secure;
  }
  function idb(mode, fn) {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('kt_dev', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('k');
        req.onerror = () => resolve(null);
        req.onsuccess = () => {
          try {
            const tx = req.result.transaction('k', mode);
            const r = fn(tx.objectStore('k'));
            tx.oncomplete = () => resolve(r && r.result !== undefined ? r.result : null);
            tx.onerror = () => resolve(null);
          } catch (e) { resolve(null); }
        };
      } catch (e) { resolve(null); }
    });
  }

  // ناسنامەی سەرەکی: لە سێ شوێن پاشەکەوت دەکرێت (localStorage + cookie + IndexedDB)
  async function getDeviceId() {
    let id = null;
    try { id = localStorage.getItem(KEY); } catch (e) {}
    id = id || readCookie() || await idb('readonly', s => s.get('id'));
    if (!id) id = uuid();
    try { localStorage.setItem(KEY, id); } catch (e) {}
    writeCookie(id);
    idb('readwrite', s => s.put(id, 'id'));
    return id;
  }

  function gpu() {
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    } catch (e) { return ''; }
  }

  async function sha(str) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
      return 'w' + h;
    }
  }

  // ڕەنگدانەوەی سیمای ئامێر (جۆری مۆبایل، شاشە، پڕۆسێسەر...)
  async function fingerprint() {
    const n = navigator, s = screen;
    return sha([
      n.userAgent, n.platform, n.language, n.hardwareConcurrency, n.deviceMemory, n.maxTouchPoints,
      s.width + 'x' + s.height + 'x' + s.colorDepth, window.devicePixelRatio,
      Intl.DateTimeFormat().resolvedOptions().timeZone, gpu()
    ].join('|'));
  }

  // جۆری مۆبایل (ئەندرۆید مۆدێلەکەی دەدات؛ ئایفۆن تەنها شاشەکەی)
  function model() {
    const ua = navigator.userAgent;
    let m = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\sBuild|\))/);
    if (m) return m[1].trim().slice(0, 60);
    if (/iPhone/.test(ua)) return 'iPhone ' + screen.width + 'x' + screen.height;
    if (/iPad/.test(ua)) return 'iPad';
    return ((navigator.platform || 'PC') + ' ' + screen.width + 'x' + screen.height).slice(0, 60);
  }

  const MSG = {
    banned: 'ئەم هەژمارە دەرکراوە.',
    device_blocked: 'ئەم ئامێرە لەلایەن سەرۆکی ماڵپەڕەوە بلۆک کراوە. تا ئیمەیڵە دەرکراوەکە نەگەڕێندرێتەوە، بە هیچ ئیمەیڵێکی تر ناتوانیت بچیتە ژوورەوە.',
    device_locked: 'ئەم ئامێرە بە ئەکاونتێکی ترەوە بەستراوەتەوە. ناتوانیت بە ئیمەیڵی تر بچیتە ژوورەوە، تکایە بە هەمان ئیمەیڵی جاران بچۆ ژوورەوە.'
  };
  const BAD = ['banned', 'device_blocked', 'device_locked'];

  // ئەنجامەکان: ok | banned | device_blocked | device_locked | no_session | error
  async function check(supabase) {
    try {
      const { data, error } = await supabase.rpc('register_device', {
        p_device_id: await getDeviceId(),
        p_fp: await fingerprint(),
        p_ua: navigator.userAgent.slice(0, 300),
        p_model: model()
      });
      if (error) { console.warn('register_device:', error.message); return 'error'; }
      if (data === 'ok') {
        const { data: { user } } = await supabase.auth.getUser();
        try { if (user && user.email) localStorage.setItem('kt_account', user.email); } catch (e) {}
      }
      return data;
    } catch (e) { console.warn(e); return 'error'; }
  }

  window.KurdDevice = {
    check, getDeviceId,
    isBad: (st) => BAD.includes(st),
    message: (st) => MSG[st] || MSG.banned,
    lockedEmail: () => { try { return localStorage.getItem('kt_account'); } catch (e) { return null; } }
  };
})();
