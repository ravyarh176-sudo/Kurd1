/* ===== cv-extras.js — دەبێت دوای cv-builder.js بار بکرێت ===== */
(function () {
  const $ = (id) => document.getElementById(id);
  const paper = $('paper');
  if (!paper) return;

  /* ------------------------------------------------------------------ *
   * 1) ١٠٠ دیزاین
   * ------------------------------------------------------------------ */
  const SHAPES = ['classic', 'sidebar', 'geometric', 'overlap', 'minimal'];
  const SHAPE_LABEL = { classic: 'کلاسیک', sidebar: 'لای ڕەنگاوڕەنگ', geometric: 'ئەندازیاری', overlap: 'کارت', minimal: 'سادە' };

  // ٢٥ دیزاینە کۆنەکەت وەک خۆیان
  const LEGACY = [
    ['gold', 'classic'], ['blue', 'classic'], ['green', 'classic'], ['purple', 'classic'], ['red', 'classic'],
    ['teal', 'classic'], ['rose', 'classic'], ['charcoal', 'classic'], ['orange', 'classic'], ['indigo', 'classic'], ['emerald', 'classic'],
    ['sidebar', 'sidebar'], ['sidebar-maroon', 'sidebar'], ['sidebar-forest', 'sidebar'], ['sidebar-teal', 'sidebar'],
    ['geometric', 'geometric'], ['geometric-purple', 'geometric'], ['geometric-red', 'geometric'], ['geometric-emerald', 'geometric'],
    ['overlap', 'overlap'], ['overlap-rose', 'overlap'], ['overlap-navy', 'overlap'], ['overlap-amber', 'overlap'],
    ['minimal', 'minimal'], ['minimal-navy', 'minimal']
  ];

  // ٢٠ پاڵێتی ڕەنگ [accent, deep]
  const PALETTES = [
    ['#3B82F6', '#1E3A8A'], ['#14B8A6', '#0F4C5C'], ['#F97316', '#9A3412'], ['#EF4444', '#7F1D1D'],
    ['#8B5CF6', '#4C1D95'], ['#22C55E', '#14532D'], ['#F5B301', '#8A5A00'], ['#F43F5E', '#881337'],
    ['#64748B', '#1E293B'], ['#0EA5E9', '#075985'], ['#D946EF', '#701A75'], ['#84CC16', '#365314'],
    ['#C08A3E', '#4A2C0A'], ['#10B981', '#064E3B'], ['#6366F1', '#312E81'], ['#D4A017', '#0B1F3A'],
    ['#E11D48', '#3F0D1D'], ['#06B6D4', '#164E63'], ['#9AAE2F', '#3F4A12'], ['#F97316', '#18181B']
  ];
  const FONTS = ['kufi', 'vaz'];
  const BGS = ['white', 'cream', 'mist'];
  const STS = ['bar', 'pill', 'line', 'solid'];

  function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  const DESIGNS = LEGACY.map(([tpl, shape], i) => ({ id: i + 1, tpl, shape }));
  for (let k = 0; k < 75; k++) {
    const shape = SHAPES[k % 5];
    const [accent, deep] = PALETTES[(Math.floor(k / 5) + (k % 5) * 4) % 20];
    DESIGNS.push({
      id: 26 + k, shape, tpl: shape + '-g' + k,
      vars: {
        '--accent': accent, '--accent-deep': deep,
        '--tag-bg': mix(accent, '#ffffff', 0.86), '--tag-text': deep, '--tag-border': mix(accent, '#ffffff', 0.6),
        '--h1': mix(deep, '#000000', 0.55), '--h2': mix(deep, '#000000', 0.2)
      },
      font: FONTS[k % 2], bg: BGS[Math.floor(k / 7) % 3], st: STS[Math.floor(k / 3) % 4]
    });
  }

  // ===== ٥٠ دیزاینی نوێ (ژمارە ١٠١ تا ١٥٠) — ئەوانی کۆن وەک خۆیان ماونەتەوە =====
  const PAL2 = [
    ['#2563EB', '#0B2A5B'], ['#D4A017', '#0B1F3A'], ['#14B8A6', '#0F4C5C'], ['#F97316', '#7C2D12'],
    ['#D946EF', '#4C1D95'], ['#22C55E', '#14532D'], ['#EF4444', '#7F1D1D'], ['#F43F5E', '#881337'],
    ['#E0A526', '#3F2A05'], ['#0EA5E9', '#075985'], ['#FB923C', '#9A3412'], ['#06B6D4', '#1E293B'],
    ['#10B981', '#064E3B'], ['#6366F1', '#312E81'], ['#84CC16', '#365314'], ['#C08A3E', '#4A2C0A'],
    ['#64748B', '#0F172A'], ['#FF6B6B', '#6B1D1D'], ['#8B5CF6', '#2E1065'], ['#2DD4BF', '#134E4A']
  ];
  // شێوە : جۆری سەرەوە / لای : شێوەی وێنە
  const ND_SPEC = [
    'sidebar:solid:round', 'sidebar:grad:round', 'sidebar:light:round', 'classic:solid:round', 'classic:grad:soft',
    'classic:light:round', 'minimal:solid:round', 'geometric:solid:round', 'overlap:solid:round', 'sidebar:solid:sq',
    'sidebar:grad:soft', 'sidebar:light:soft', 'classic:solid:sq', 'classic:light:soft', 'classic:grad:round',
    'minimal:solid:sq', 'geometric:solid:soft', 'overlap:solid:soft', 'sidebar:solid:soft', 'sidebar:grad:sq',
    'sidebar:light:sq', 'classic:solid:soft', 'classic:grad:sq', 'classic:light:sq', 'minimal:solid:soft',
    'geometric:solid:sq', 'overlap:solid:sq', 'sidebar:solid:round', 'sidebar:grad:round', 'sidebar:light:round',
    'classic:solid:round', 'classic:grad:soft', 'classic:light:round', 'minimal:solid:round', 'geometric:solid:round',
    'overlap:solid:round', 'sidebar:solid:sq', 'sidebar:grad:soft', 'sidebar:light:soft', 'classic:solid:sq',
    'classic:grad:round', 'classic:light:soft', 'minimal:solid:sq', 'geometric:solid:soft', 'overlap:solid:soft',
    'sidebar:solid:soft', 'sidebar:grad:sq', 'sidebar:light:sq', 'classic:solid:round', 'sidebar:grad:round'
  ];
  ND_SPEC.forEach((spec, i) => {
    const [shape, hd, photo] = spec.split(':');
    const [accent, deep] = PAL2[(i * 7 + 3) % 20];
    DESIGNS.push({
      id: 101 + i, grp: 'new', shape, tpl: shape + '-n' + i, hd, photo,
      vars: {
        '--accent': accent, '--accent-deep': deep,
        '--tag-bg': mix(accent, '#ffffff', 0.86), '--tag-text': deep, '--tag-border': mix(accent, '#ffffff', 0.6),
        '--h1': mix(deep, '#000000', 0.55), '--h2': mix(deep, '#000000', 0.2), '--soft': mix(accent, '#ffffff', 0.9)
      },
      font: FONTS[i % 2], bg: BGS[i % 3], st: STS[(i + 1) % 4]
    });
  });

  const VAR_NAMES = ['--accent', '--accent-deep', '--tag-bg', '--tag-text', '--tag-border', '--h1', '--h2', '--soft'];
  function styleEl(el, d) {
    ['data-gal', 'data-font', 'data-bg', 'data-st', 'data-hd', 'data-photo'].forEach(a => el.removeAttribute(a));
    VAR_NAMES.forEach(v => el.style.removeProperty(v));
    el.dataset.tpl = d.tpl;
    if (d.vars) {
      el.setAttribute('data-gal', '1');
      el.dataset.font = d.font; el.dataset.bg = d.bg; el.dataset.st = d.st;
      if (d.hd) { el.dataset.hd = d.hd; el.dataset.photo = d.photo; }
      Object.keys(d.vars).forEach(k => el.style.setProperty(k, d.vars[k]));
    }
  }

  let currentId = 1;
  function applyDesign(d) {
    styleEl(paper, d);
    currentId = d.id;
    try { localStorage.setItem('cvGalleryChoice', String(d.id)); localStorage.setItem('cvTemplateChoice', d.tpl); } catch (e) {}
  }

  // دیزاینی پاشەکەوتکراو
  try {
    const saved = parseInt(localStorage.getItem('cvGalleryChoice'), 10);
    const found = DESIGNS.find(x => x.id === saved);
    if (found) applyDesign(found);
  } catch (e) {}

  // ===== API بۆ «کۆدی زیادە»ی ئەدمین: KurdCV.addDesign({...}) =====
  window.KurdCV = {
    designs: DESIGNS,
    addDesign(o) {
      if (!o || !o.id || DESIGNS.some(x => x.id === o.id)) return false;
      const shape = SHAPES.includes(o.shape) ? o.shape : 'classic';
      const d = { id: o.id, grp: 'mine', shape, tpl: o.tpl || (shape + '-x' + o.id) };
      if (o.accent) {
        const accent = o.accent, deep = o.deep || mix(accent, '#000000', 0.55);
        d.hd = o.hd || 'solid'; d.photo = o.photo || 'round';
        d.vars = {
          '--accent': accent, '--accent-deep': deep,
          '--tag-bg': mix(accent, '#ffffff', 0.86), '--tag-text': deep, '--tag-border': mix(accent, '#ffffff', 0.6),
          '--h1': mix(deep, '#000000', 0.55), '--h2': mix(deep, '#000000', 0.2), '--soft': mix(accent, '#ffffff', 0.9)
        };
        d.font = o.font || 'kufi'; d.bg = o.bg || 'white'; d.st = o.st || 'bar';
      }
      DESIGNS.push(d);
      try { if (parseInt(localStorage.getItem('cvGalleryChoice'), 10) === o.id) applyDesign(d); } catch (e) {}
      const ce = document.querySelector('.open-gallery-btn .gallery-count');
      if (ce) ce.textContent = '(' + DESIGNS.length.toLocaleString('ar-EG') + ' دیزاین)';
      return true;
    }
  };

  // نووسینی دوگمەکە
  const countEl = document.querySelector('.open-gallery-btn .gallery-count');
  if (countEl) countEl.textContent = '(' + DESIGNS.length.toLocaleString('ar-EG') + ' دیزاین)';

  // ---------- گەلەری ----------
  const overlay = $('galleryOverlay');
  const galBody = overlay && overlay.querySelector('.gallery-body');
  const heading = overlay && overlay.querySelector('.gallery-head h2');
  if (heading) heading.textContent = 'دیزاینی CVـەکەت هەڵبژێرە — ' + DESIGNS.length.toLocaleString('ar-EG') + ' دیزاین';

  const filters = document.createElement('div');
  filters.className = 'gal-filters';
  filters.innerHTML = '<button type="button" class="gal-chip active" data-f="all">هەموو (' + DESIGNS.length.toLocaleString('ar-EG') + ')</button>' +
    '<button type="button" class="gal-chip" data-f="new">✨ نوێ (٥٠)</button>' +
    SHAPES.map(s => `<button type="button" class="gal-chip" data-f="${s}">${SHAPE_LABEL[s]}</button>`).join('');
  const grid = document.createElement('div');
  grid.className = 'gal-grid';
  if (galBody) { galBody.prepend(grid); galBody.prepend(filters); }

  let io = null;
  function cloneForThumb(d) {
    const c = paper.cloneNode(true);
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    c.querySelectorAll('a').forEach(a => a.removeAttribute('href'));
    styleEl(c, d);
    return c;
  }

  function buildGrid() {
    if (io) io.disconnect();
    grid.innerHTML = '';
    io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const card = en.target;
        io.unobserve(card);
        const d = DESIGNS[parseInt(card.dataset.idx, 10)];
        const thumb = card.querySelector('.gal-thumb');
        thumb.innerHTML = '';
        thumb.appendChild(cloneForThumb(d));
      });
    }, { root: galBody, rootMargin: '400px 0px' });

    DESIGNS.forEach((d, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gal-card' + (d.id === currentId ? ' active' : '');
      card.dataset.idx = idx; card.dataset.shape = d.shape; card.dataset.grp = d.grp || '';
      card.innerHTML = `<span class="gal-check">✓</span><div class="gal-thumb"><div class="gal-thumb-skel"></div></div>
        <div class="gal-meta"><b>${d.id.toLocaleString('ar-EG')}</b><span>${SHAPE_LABEL[d.shape]}</span></div>`;
      card.addEventListener('click', () => {
        applyDesign(d);
        overlay.classList.remove('open');
        setTimeout(() => paper.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      });
      grid.appendChild(card);
      io.observe(card);
    });
    applyFilter(filters.querySelector('.gal-chip.active').dataset.f);
    fitScale();
  }

  function applyFilter(f) {
    grid.querySelectorAll('.gal-card').forEach(c => { c.hidden = !(f === 'all' || c.dataset.shape === f || (f === 'new' && c.dataset.grp === 'new')); });
  }
  filters.addEventListener('click', (e) => {
    const b = e.target.closest('.gal-chip'); if (!b) return;
    filters.querySelectorAll('.gal-chip').forEach(x => x.classList.toggle('active', x === b));
    applyFilter(b.dataset.f);
    galBody.scrollTop = 0;
    fitScale();
  });

  function fitScale() {
    const t = grid.querySelector('.gal-card:not([hidden]) .gal-thumb');
    if (t && t.clientWidth) grid.style.setProperty('--s', (t.clientWidth / 560).toFixed(4));
  }
  window.addEventListener('resize', fitScale);

  const openBtn = $('openGalleryBtn');
  if (openBtn) openBtn.addEventListener('click', () => { buildGrid(); requestAnimationFrame(fitScale); });

  /* ------------------------------------------------------------------ *
   * 2) بەشی تایبەت بە خۆت — بە چەند لاین
   * ------------------------------------------------------------------ */
  const customList = $('customList');
  const customTarget = $('pCustomSections');

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function renderCustomPreview() {
    if (!customTarget || !customList) return;
    customTarget.innerHTML = '';
    customList.querySelectorAll('.repeat-item').forEach(block => {
      const title = block.querySelector('.u-title').value.trim();
      const lines = Array.from(block.querySelectorAll('.cx-line input')).map(i => i.value.trim()).filter(Boolean);
      if (!lines.length) return;
      const sec = document.createElement('div');
      sec.className = 'p-section';
      sec.innerHTML = `<div class="p-section-title">${esc(title || 'بەشی تایبەت')}</div>
        <ul class="p-list">${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
      customTarget.appendChild(sec);
    });
  }

  function addLine(block, focus) {
    const wrap = block.querySelector('.cx-lines');
    const row = document.createElement('div');
    row.className = 'cx-line';
    row.innerHTML = '<input type="text" placeholder="زانیارییەکەت بنووسە..."><button type="button" class="cx-line-del" aria-label="سڕینەوە">✕</button>';
    const input = row.querySelector('input');
    input.addEventListener('input', renderCustomPreview);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addLine(block, true); }
    });
    row.querySelector('.cx-line-del').addEventListener('click', () => {
      if (wrap.children.length > 1) row.remove(); else input.value = '';
      renderCustomPreview();
    });
    wrap.appendChild(row);
    if (focus) input.focus();
  }

  function addCustomSection() {
    if (!customList) return;
    const block = document.createElement('div');
    block.className = 'repeat-item';
    block.dataset.role = 'custom';
    block.innerHTML = `
      <div class="repeat-head"><span>بەشی تایبەت</span><button type="button" class="btn-remove">لابردن</button></div>
      <div class="field"><label>ناونیشانی بەشەکە</label><input class="u-title" type="text" placeholder="بۆ نموونە: هۆبی و ئارەزووەکان"></div>
      <div class="field"><label>زانیارییەکان (هەر لاینێک بە جیا)</label><div class="cx-lines"></div></div>
      <button type="button" class="cx-add-line">+ لاینێکی تر</button>`;
    block.querySelector('.u-title').addEventListener('input', renderCustomPreview);
    block.querySelector('.btn-remove').addEventListener('click', () => { block.remove(); renderCustomPreview(); });
    block.querySelector('.cx-add-line').addEventListener('click', () => addLine(block, true));
    customList.appendChild(block);
    addLine(block, false);
    block.querySelector('.u-title').focus();
  }
  const addCustomBtn = $('addCustomBtn');
  if (addCustomBtn) addCustomBtn.addEventListener('click', addCustomSection);

  /* ------------------------------------------------------------------ *
   * 3) دوگمەی چاو — پیشاندانی CV + داگرتن
   * ------------------------------------------------------------------ */
  const actions = document.querySelector('.topbar-actions');
  const eye = document.createElement('button');
  eye.type = 'button'; eye.className = 'btn-eye'; eye.id = 'viewCvBtn'; eye.setAttribute('aria-label', 'پیشاندانی CV');
  eye.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  if (actions) actions.prepend(eye);

  const view = document.createElement('div');
  view.className = 'view-overlay no-print';
  view.innerHTML = `
    <div class="view-bar">
      <div class="view-actions">
        <button type="button" class="view-btn" id="vwImg">🖼️ داگرتن وەک وێنە</button>
        <button type="button" class="view-btn alt" id="vwPdf">📄 PDF</button>
      </div>
      <button type="button" class="view-close" aria-label="داخستن">✕</button>
    </div>
    <div class="view-stage"><div class="view-holder"></div></div>`;
  document.body.appendChild(view);

  function openView() {
    const holder = view.querySelector('.view-holder');
    holder.innerHTML = '';
    const c = paper.cloneNode(true);
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    holder.appendChild(c);
    view.classList.add('open');
    const stage = view.querySelector('.view-stage');
    const s = Math.min(1.15, (stage.clientWidth - 32) / 560);
    c.style.transform = `scale(${s})`;
    holder.style.width = (560 * s) + 'px';
    holder.style.height = (c.offsetHeight * s) + 'px';
  }
  function closeView() { view.classList.remove('open'); }
  eye.addEventListener('click', openView);
  view.querySelector('.view-close').addEventListener('click', closeView);

  function fileName() { return (($('fName') && $('fName').value) || 'CV').trim().replace(/\s+/g, '-'); }
  function notifyExported() { window.dispatchEvent(new Event('cv:exported')); }

  async function saveImage(btn) {
    if (typeof html2canvas === 'undefined') { alert('ئامرازی وێنەگرتن بارنەبووە، ئینتەرنێتەکەت بپشکنە.'); return; }
    const label = btn.innerHTML; btn.disabled = true; btn.textContent = '...';
    try {
      const canvas = await html2canvas(paper, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], fileName() + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: fileName() }); notifyExported(); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = fileName() + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      notifyExported();
    } catch (e) {
      alert('نەتوانرا وێنەکە دروست بکرێت، دووبارە هەوڵ بدەرەوە.');
    } finally { btn.disabled = false; btn.innerHTML = label; }
  }
  $('vwImg') && $('vwImg').addEventListener('click', (e) => saveImage(e.currentTarget));
  $('vwPdf') && $('vwPdf').addEventListener('click', () => { closeView(); setTimeout(() => window.print(), 150); });

  // دوگمە کۆنەکانی سەرەوە (وێنە / PDF) یش ڕەزامەندی دەورووژێنن
  const oldImg = $('imageBtn');
  if (oldImg) {
    new MutationObserver(() => { if (!oldImg.disabled) notifyExported(); })
      .observe(oldImg, { attributes: true, attributeFilter: ['disabled'] });
  }
  window.addEventListener('afterprint', notifyExported);

  /* ------------------------------------------------------------------ *
   * 4) پەیامی ڕەزامەندی (دوای دروستکردنی CV)
   * ------------------------------------------------------------------ */
  let askedThisSession = false;
  let exportTimer = null;
  window.addEventListener('cv:exported', () => {
    clearTimeout(exportTimer);
    exportTimer = setTimeout(handleExported, 600);
  });

  function sb() { return window.kurdtechSupabase; }
  function uid() { return window.kurdtechUser && window.kurdtechUser.id; }

  async function handleExported() {
    const s = sb(), id = uid();
    let answered = false;
    try { answered = localStorage.getItem('cvFeedback_' + (id || 'anon')) === '1'; } catch (e) {}
    if (s && id) {
      try {
        // تۆمارکردنی ئەوەی ئەم کەسە CVی دروستکردووە (یەک جار)
        await s.from('cv_usage').upsert({ user_id: id }, { onConflict: 'user_id', ignoreDuplicates: true });
        if (!answered) {
          const { data } = await s.from('cv_usage').select('satisfied').eq('user_id', id).maybeSingle();
          if (data && data.satisfied !== null && data.satisfied !== undefined) answered = true;
        }
      } catch (e) { console.warn('cv_usage', e); }
    }
    if (answered || askedThisSession) return;
    askedThisSession = true;
    showFeedback();
  }

  function showFeedback() {
    const ov = document.createElement('div');
    ov.className = 'fb-overlay';
    ov.innerHTML = `
      <div class="fb-card">
        <div class="fb-emoji">🎉</div>
        <h3>CVـەکەت ئامادەیە!</h3>
        <p>ئایا ئەم ئەپە سوودی هەبوو بۆت؟</p>
        <div class="fb-row">
          <button type="button" class="fb-btn fb-yes" data-v="1">👍 بەڵێ</button>
          <button type="button" class="fb-btn fb-no" data-v="0">👎 بەدڵم نییە</button>
        </div>
        <button type="button" class="fb-later">دواتر</button>
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('open'));
    const close = () => { ov.classList.remove('open'); setTimeout(() => ov.remove(), 250); };
    ov.querySelector('.fb-later').addEventListener('click', close);
    ov.querySelectorAll('.fb-btn').forEach(b => b.addEventListener('click', async () => {
      const satisfied = b.dataset.v === '1';
      ov.querySelector('.fb-card').innerHTML = '<div class="fb-emoji">' + (satisfied ? '💛' : '🙏') + '</div><div class="fb-thanks">سوپاس بۆ ڕاکەت!</div>';
      try { localStorage.setItem('cvFeedback_' + (uid() || 'anon'), '1'); } catch (e) {}
      const s = sb(), id = uid();
      if (s && id) {
        try { await s.from('cv_usage').upsert({ user_id: id, satisfied, answered_at: new Date().toISOString() }, { onConflict: 'user_id' }); }
        catch (e) { console.warn('cv_usage', e); }
      }
      setTimeout(close, 1200);
    }));
  }

  // بۆ تاقیکردنەوە لە کۆنسۆڵ: window.__cvFeedbackTest()
  window.__cvFeedbackTest = showFeedback;
})();
