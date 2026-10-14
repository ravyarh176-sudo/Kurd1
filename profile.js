// Kurd Technology — پرۆفایلی بەکارهێنەر (services.html).
// کلیک لەسەر ڕەسمی سەرەوە: ناو بگۆڕە، ڕەسم دابنێ و ڕێکی بخە، ئایدی ببینە و کۆپی بکە، یان بچۆ دەرەوە.
// خشتەکان: user_profiles (ناو + ڕەسم، تەنها خاوەنەکەی دەیبینێت) و user_ids (ئایدی). SQL: user-profile.sql

window.addEventListener('kurdtech:ready', async () => {
  const sb = window.kurdtechSupabase;
  const user = window.kurdtechUser;
  const chip = document.getElementById('userChip');
  if (!sb || !user || !chip) return;

  const chipImg = document.getElementById('userChipImg') || chip.querySelector('img');
  const KEY = 'kf_prof_' + user.id;
  const lsGet = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const lsSet = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  const DEF = chipImg ? chipImg.src : '';

  let prof = lsGet() || {};
  let code = '';

  const paint = () => { if (chipImg) chipImg.src = prof.avatar || DEF; };
  paint();

  // لە سێرڤەر وەربگرە (بێ ئەوەی چاوەڕێی بکەین)
  (async () => {
    try {
      const { data } = await sb.from('user_profiles').select('display_name,avatar').eq('user_id', user.id).maybeSingle();
      if (data) { prof = { display_name: data.display_name, avatar: data.avatar }; lsSet(prof); paint(); }
    } catch (e) {}
    try {
      const r = await sb.rpc('ensure_my_code');
      if (!r.error && r.data) { code = r.data; const c = document.getElementById('kfpCode'); if (c) c.textContent = code; }
    } catch (e) {}
  })();

  // ---------- پەنجەرەی پرۆفایل ----------
  const ov = document.createElement('div');
  ov.className = 'kfp-ov';
  ov.innerHTML = `<div class="kfp">
    <h3>پرۆفایلی من</h3>
    <img class="kfp-av" id="kfpAv" alt="">
    <button class="kfp-btn kfp-sec" id="kfpPick" type="button">📷 گۆڕینی ڕەسم</button>
    <input type="file" id="kfpFile" accept="image/*" hidden>
    <div class="kfp-lbl">ناوی من</div>
    <input class="kfp-in" id="kfpName" maxlength="40" placeholder="ناوی خۆت بنووسە">
    <div class="kfp-lbl">ئایدیی من</div>
    <div class="kfp-id"><b id="kfpCode">...</b><button id="kfpCopy" type="button">کۆپی</button></div>
    <div class="kfp-note">ڕەسمەکەت تەنها تۆ دەیبینیت. ئەدمین تەنها ئایدییەکەت دەبینێت.</div>
    <button class="kfp-btn kfp-pri" id="kfpSave" type="button">هەڵگرتن</button>
    <button class="kfp-btn kfp-sec" id="kfpClose" type="button">داخستن</button>
    <button class="kfp-btn kfp-out" id="kfpOut" type="button">چوونەدەرەوە لە هەژمار</button>
  </div>`;
  document.body.appendChild(ov);
  const el = (id) => document.getElementById(id);
  let pending = null;

  function open() {
    pending = null;
    el('kfpAv').src = prof.avatar || DEF;
    el('kfpName').value = prof.display_name || (window.kurdtechProfile && window.kurdtechProfile.full_name) || '';
    el('kfpCode').textContent = code || '...';
    ov.classList.add('open');
  }
  chip.addEventListener('click', (e) => { e.preventDefault(); open(); });
  el('kfpClose').onclick = () => ov.classList.remove('open');
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.remove('open'); });

  el('kfpCopy').onclick = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); } catch (e) {
      const t = document.createElement('textarea'); t.value = code; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (_) {} t.remove();
    }
    el('kfpCopy').textContent = '✓ کۆپی کرا';
    setTimeout(() => { el('kfpCopy').textContent = 'کۆپی'; }, 1500);
  };

  el('kfpOut').onclick = async () => {
    if (!confirm('دەتەوێت چوونەدەرەوە بکەیت؟')) return;
    try { await sb.auth.signOut(); } catch (e) {}
    window.location.href = 'index.html';
  };

  // ---------- ڕێکخستنی ڕەسم (ڕاکێشان + نزیک/دوور) ----------
  const cov = document.createElement('div');
  cov.className = 'kfc-ov';
  cov.innerHTML = `<div class="kfc">
    <h4>ڕێکخستنی ڕەسم</h4>
    <p>بە پەنجە بیجووڵێنە و نزیک/دووری بکە</p>
    <canvas id="kfcCv" width="300" height="300"></canvas>
    <div class="kfc-zoom"><span>−</span><input type="range" id="kfcZoom" min="1" max="4" step="0.01" value="1"><span>+</span></div>
    <button class="kfp-btn kfp-pri" id="kfcOk" type="button">بەکارهێنان</button>
    <button class="kfp-btn kfp-sec" id="kfcNo" type="button">پاشگەزبوونەوە</button>
  </div>`;
  document.body.appendChild(cov);
  const cv = el('kfcCv'), cx = cv.getContext('2d'), S = 300;
  let im = null, base = 1, zoom = 1, ox = 0, oy = 0;

  const clamp = () => {
    const k = base * zoom, w = im.naturalWidth * k, h = im.naturalHeight * k;
    ox = Math.max(Math.min(0, S - w), Math.min(0, ox));
    oy = Math.max(Math.min(0, S - h), Math.min(0, oy));
  };
  const draw = () => {
    cx.clearRect(0, 0, S, S);
    if (!im) return;
    const k = base * zoom;
    cx.drawImage(im, ox, oy, im.naturalWidth * k, im.naturalHeight * k);
  };

  el('kfpPick').onclick = () => el('kfpFile').click();
  el('kfpFile').onchange = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      im = img;
      base = Math.max(S / img.naturalWidth, S / img.naturalHeight);
      zoom = 1; el('kfcZoom').value = 1;
      ox = (S - img.naturalWidth * base) / 2;
      oy = (S - img.naturalHeight * base) / 2;
      draw();
      cov.classList.add('open');
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { alert('ئەم وێنەیە نەکرایەوە'); URL.revokeObjectURL(url); };
    img.src = url;
  };

  el('kfcZoom').addEventListener('input', (e) => {
    // نزیککردنەوە لە ناوەڕاستەوە
    const old = base * zoom, nz = parseFloat(e.target.value), nk = base * nz;
    const cxm = (S / 2 - ox) / old, cym = (S / 2 - oy) / old;
    zoom = nz; ox = S / 2 - cxm * nk; oy = S / 2 - cym * nk;
    clamp(); draw();
  });
  let drag = null;
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, ox, oy }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', (e) => {
    if (!drag || !im) return;
    const r = cv.getBoundingClientRect(), f = S / r.width;
    ox = drag.ox + (e.clientX - drag.x) * f;
    oy = drag.oy + (e.clientY - drag.y) * f;
    clamp(); draw();
  });
  const end = () => { drag = null; cv.style.cursor = 'grab'; };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);

  el('kfcNo').onclick = () => { cov.classList.remove('open'); im = null; };
  el('kfcOk').onclick = () => {
    if (!im) return;
    const O = 256, out = document.createElement('canvas');
    out.width = out.height = O;
    const k = base * zoom, f = O / S;
    out.getContext('2d').drawImage(im, ox * f, oy * f, im.naturalWidth * k * f, im.naturalHeight * k * f);
    pending = out.toDataURL('image/jpeg', 0.82);
    el('kfpAv').src = pending;
    cov.classList.remove('open'); im = null;
  };

  // ---------- هەڵگرتن ----------
  el('kfpSave').onclick = async () => {
    const b = el('kfpSave');
    b.disabled = true; b.textContent = 'چاوەڕوان بە...';
    const name = el('kfpName').value.trim().slice(0, 40);
    const row = {
      user_id: user.id,
      display_name: name || null,
      avatar: pending || prof.avatar || null,
      updated_at: new Date().toISOString()
    };
    const { error } = await sb.from('user_profiles').upsert(row, { onConflict: 'user_id' });
    b.disabled = false; b.textContent = 'هەڵگرتن';
    if (error) { alert('هەڵگیرا نەکرا. دڵنیابە SQLەکە ڕەن کراوە.'); return; }
    if (name) {
      // ناوەکە لە لیستی ئەدمینیش بگۆڕێ
      try {
        const u = await sb.from('profiles').update({ full_name: name }).eq('id', user.id);
        if (!u.error && window.kurdtechProfile) window.kurdtechProfile.full_name = name;
      } catch (e) {}
    }
    prof = { display_name: row.display_name, avatar: row.avatar };
    lsSet(prof); paint();
    ov.classList.remove('open');
  };
});
