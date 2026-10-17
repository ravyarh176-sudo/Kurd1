// Kurd Technology — Service Worker: فایلەکانی سایت لە ئیدیتۆر (خشتەی site_files) جێگەی فایلەکانی GitHub دەگرنەوە.
// هەر فایلێک لە site_files هەبێت (بۆ نموونە services.html)، لە جیاتی وەشانی GitHub پیشان دەدرێت.
// دەستپێکردن: site-code.js ئەم فایلە تۆمار دەکات. ئەگەر فایلێک نەبێت، وەشانی GitHub بەکار دێت.
// خێرایی: فایلە جێگیرەکان (JS/CSS/وێنە/فۆنت/CDN) لەناو ئامێرەکە پاشەکەوت دەکرێن، بۆیە لەسەر ئینتەرنێتی لاواز هەر خێرا دەکرێنەوە.
'use strict';
self.window = self;
try { importScripts('config.js'); } catch (e) {}
const URL_ = self.SUPABASE_URL, KEY = self.SUPABASE_ANON_KEY;

// ئەم فایلانە هەرگیز نادرێنە جێگە (تا ئیدیتۆر و ڕاگرتنی سایتەکە هەمیشە ساغ بێت)
const PROTECT = ['sw.js', 'config.js', 'site-code.js', 'editor.html', 'editor.js', 'editor.css'];
const DB = 'kf_sw', ST = 'files';
const CACHE = 'kf-static-v1';
const CDN = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];
const IMG_EXT = /\.(?:png|jpe?g|webp|gif|svg|ico|woff2?|ttf|mp3)$/i;

let ov = new Map();          // path -> {path, content, encoding, mime, updated_at}
let pv = new Map();          // پێشبینین (لە ئیدیتۆرەوە، پاشەکەوتنەکراو)
let loaded = false, lastSync = 0, syncing = null;

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST, { keyPath: 'path' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function dbAll() {
  const d = await idb();
  return new Promise((res) => {
    const q = d.transaction(ST).objectStore(ST).getAll();
    q.onsuccess = () => res(q.result || []);
    q.onerror = () => res([]);
  });
}
async function dbWrite(put, del) {
  const d = await idb();
  return new Promise((res) => {
    const tx = d.transaction(ST, 'readwrite'), s = tx.objectStore(ST);
    put.forEach(r => s.put(r)); del.forEach(p => s.delete(p));
    tx.oncomplete = () => res(true); tx.onerror = () => res(false);
  });
}
const ready = (async () => {
  try { (await dbAll()).forEach(r => ov.set(r.path, r)); } catch (e) {}
  loaded = true;
})();

async function rest(q) {
  if (!URL_ || !KEY) return null;
  try {
    const r = await fetch(URL_ + '/rest/v1/' + q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }, cache: 'no-store' });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
}

async function sync(force) {
  if (syncing) return syncing;
  if (!force && Date.now() - lastSync < 60000) return;
  syncing = (async () => {
    await ready;
    const list = await rest('site_files?select=path,updated_at&enabled=eq.true');
    if (!list) return;
    lastSync = Date.now();
    const need = list.filter(x => { const h = ov.get(x.path); return !h || h.updated_at !== x.updated_at; }).map(x => x.path);
    const alive = new Set(list.map(x => x.path));
    const gone = [...ov.keys()].filter(p => !alive.has(p));
    if (!need.length && !gone.length) return;
    let rows = [];
    for (let i = 0; i < need.length; i += 8) {
      const part = need.slice(i, i + 8);
      const q = 'site_files?select=path,content,encoding,mime,updated_at&enabled=eq.true&path=in.(' +
        part.map(p => '"' + p.replace(/"/g, '\\"') + '"').join(',') + ')';
      const got = await rest(encodeURI(q).replace(/%25/g, '%'));
      if (!got) return; // نەتوانرا: هەمان پێشوو بمێنێتەوە
      rows = rows.concat(got);
    }
    rows.forEach(r => ov.set(r.path, r));
    gone.forEach(p => ov.delete(p));
    await dbWrite(rows, gone);
    const cs = await self.clients.matchAll({ includeUncontrolled: true });
    cs.forEach(c => c.postMessage({ type: 'sw-updated', paths: need.concat(gone) }));
  })().finally(() => { syncing = null; });
  return syncing;
}

const MIME = {
  html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', svg: 'image/svg+xml', txt: 'text/plain; charset=utf-8',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', mp3: 'audio/mpeg', mp4: 'video/mp4', pdf: 'application/pdf', xml: 'application/xml'
};
function build(row) {
  const ext = (row.path.split('.').pop() || '').toLowerCase();
  const type = row.mime || MIME[ext] || 'application/octet-stream';
  let body = row.content;
  if (row.encoding === 'base64') {
    const bin = atob(row.content), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    body = u;
  }
  return new Response(body, { status: 200, headers: { 'Content-Type': type, 'Cache-Control': 'no-cache', 'X-KF-Override': '1' } });
}
function pathOf(u) {
  let p = decodeURIComponent(u.pathname).replace(/^\/+/, '');
  if (!p || p.endsWith('/')) p += 'index.html';
  return p;
}
function lookup(map, p) {
  if (map.has(p)) return map.get(p);
  if (!/\.[a-z0-9]+$/i.test(p) && map.has(p + '.html')) return map.get(p + '.html');
  return null;
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  try { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.startsWith('kf-static-') && k !== CACHE).map(k => caches.delete(k))); } catch (x) {}
  await self.clients.claim(); await sync(true);
})()));

// ---------- خێرایی: پاشەکەوتکردن لەناو ئامێر ----------
const okRes = (r) => r && (r.status === 200 || r.type === 'opaque');
// وێنە/فۆنت/CDN: یەکسەر لە پاشەکەوت، لە پشتەوە نوێ دەکرێتەوە
async function swr(req, e) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  const net = fetch(req).then(r => { if (okRes(r)) c.put(req, r.clone()); return r; }).catch(() => null);
  if (hit) { e.waitUntil(net); return hit; }
  return (await net) || Response.error();
}
// پەڕە/JS/CSS: ئینتەرنێت یەکەم؛ ئەگەر لەسەر کات (ms) وەڵامی نەدا، لە پاشەکەوت
async function netFirst(req, e, ms, isDoc) {
  const c = await caches.open(CACHE);
  const net = fetch(req).then(r => { if (okRes(r) && r.type !== 'opaqueredirect' && !r.redirected) c.put(req, r.clone()); return r; }).catch(() => null);
  const hit = await c.match(req, isDoc ? { ignoreSearch: true } : undefined);
  if (!hit) return (await net) || Response.error();
  const first = await Promise.race([net, new Promise(res => setTimeout(() => res(null), ms))]);
  if (first) return first;
  e.waitUntil(net);
  return hit;
}
function smart(req, u, e) {
  if (req.headers.has('range')) return fetch(req);
  if (req.mode === 'navigate' || req.destination === 'document') return netFirst(req, e, 2500, true);
  if (/\.(?:js|css)$/i.test(u.pathname)) return netFirst(req, e, 1500, false);
  if (IMG_EXT.test(u.pathname)) return swr(req, e);
  return fetch(req);
}

self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'sync') e.waitUntil(sync(true).then(() => e.ports[0] && e.ports[0].postMessage({ ok: true })));
  else if (d.type === 'preview') { pv = new Map(Object.entries(d.files || {}).map(([p, v]) => [p, v])); if (e.ports[0]) e.ports[0].postMessage({ ok: true }); }
  else if (d.type === 'has') e.waitUntil((async () => { await ready; await sync(false); if (e.ports[0]) e.ports[0].postMessage({ has: !!lookup(ov, d.path) }); })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) {
    if (CDN.includes(u.hostname) && !req.headers.has('range')) e.respondWith(swr(req, e));
    return;
  }
  const p = pathOf(u);
  if (PROTECT.includes(p)) return;
  if (u.searchParams.has('kf_orig')) return;              // وەشانی ئۆریجینالی GitHub
  if (/(^|[?&])safe=1/.test(u.search)) return;              // دۆخی ئاسوودە
  if (/^rest\/v1\//.test(p)) return;
  if (req.mode === 'navigate') e.waitUntil(sync(false));

  e.respondWith((async () => {
    await ready;
    let cu = null;
    if (e.clientId) { try { const c = await self.clients.get(e.clientId); cu = c && c.url; } catch (x) {} }
    if (cu && /\/editor\.html/.test(cu)) return fetch(req);   // ئیدیتۆر هەمیشە وەشانی ئۆریجینال بەکار دێنێت
    if (cu && /[?&]safe=1/.test(cu)) return fetch(req);
    const inPreview = /[?&]kf_pv=1/.test(u.search) || (cu && /[?&]kf_pv=1/.test(cu));
    if (inPreview) { const r = lookup(pv, p); if (r) return build(r); }
    const r = lookup(ov, p);
    return r ? build(r) : smart(req, u, e);
  })());
});
