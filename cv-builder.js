// Kurd Technology — CV Builder (Front-End Core Engine)
(function () {
  'use strict';

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const DEFAULT_PHOTO_SRC =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><rect width='160' height='160' fill='%231b2438'/><circle cx='80' cy='62' r='28' fill='%23fdba12' opacity='0.85'/><path d='M36 136 c0 -26 20 -44 44 -44 s44 18 44 44 Z' fill='%23fdba12' opacity='0.85'/></svg>";

  // ---------- Live Mirroring (Inputs -> Preview Paper) ----------
  function initMirroring() {
    const map = [
      ['fName', 'pName', 'محمد احمد'],
      ['fTitle', 'pTitle', 'گەشەپێدەری وێب و نەرمەکاڵا'],
      ['fEmail', 'pEmail', 'muhammad@example.com'],
      ['fPhone', 'pPhone', '+964 750 000 0000'],
      ['fAddress', 'pAddress', 'هەولێر، کوردستان'],
      ['fSummary', 'pSummary', 'گەشەپێدەرێکی لێهاتوو بە ئەزموونی ٥ ساڵ لە بواری دروستکردنی ماڵپەڕ و سیستەمی بەڕێوەبردن.'],
      ['fObjective', 'pObjective', 'ئامانجم بەدەستهێنانی پێگەیەکی کارییە کە بتوانم تواناکانم بەکاربهێنم بۆ گەشەپێدانی پڕۆژە پێشکەوتووەکان.']
    ];

    map.forEach(([inputId, previewId, fallback]) => {
      const input = $(inputId);
      const preview = $(previewId);
      if (!input || !preview) return;

      const update = () => {
        const val = (input.value || '').trim();
        preview.textContent = val || fallback;
      };

      input.addEventListener('input', update);
      update();
    });
  }

  // ---------- Experience Dynamic List ----------
  function initExperience() {
    const list = $('expList');
    const addBtn = $('addExpBtn');
    const pContainer = $('pExpList');
    if (!list || !addBtn || !pContainer) return;

    function renderPreview() {
      const items = Array.from(list.children);
      if (!items.length) {
        pContainer.innerHTML = '<p class="p-item-desc" style="opacity:.6">هیچ ئەزموونێک زیاد نەکراوە.</p>';
        return;
      }
      pContainer.innerHTML = items
        .map((item) => {
          const role = item.querySelector('.exp-role')?.value.trim() || 'ناونیشانی کار';
          const comp = item.querySelector('.exp-comp')?.value.trim() || 'کۆمپانیا';
          const date = item.querySelector('.exp-date')?.value.trim() || '٢٠٢١ - ئێستا';
          const desc = item.querySelector('.exp-desc')?.value.trim() || '';
          return `
            <div class="p-item">
              <div class="p-item-head">
                <div class="p-item-role">${escapeHtml(role)}</div>
                <div class="p-item-date">${escapeHtml(date)}</div>
              </div>
              <div class="p-item-sub">${escapeHtml(comp)}</div>
              ${desc ? `<div class="p-item-desc">${escapeHtml(desc)}</div>` : ''}
            </div>
          `;
        })
        .join('');
    }

    function addRow(role = '', comp = '', date = '', desc = '') {
      const row = document.createElement('div');
      row.className = 'dyn-row';
      row.innerHTML = `
        <div class="dyn-grid">
          <input type="text" class="exp-role" placeholder="ناونیشانی کار (وەک: گەشەپێدەری وێب)" value="${escapeAttr(role)}">
          <input type="text" class="exp-comp" placeholder="کۆمپانیا یان شوێنی کار" value="${escapeAttr(comp)}">
          <input type="text" class="exp-date" placeholder="ماوە (وەک: ٢٠٢١ - ٢٠٢٣)" value="${escapeAttr(date)}">
        </div>
        <textarea class="exp-desc" rows="2" placeholder="باسی ئەرک و دەستکەوتەکانت لەم کارەدا بکە...">${escapeHtml(desc)}</textarea>
        <button type="button" class="del-row-btn" title="سڕینەوە">✕ سڕینەوە</button>
      `;
      row.querySelectorAll('input, textarea').forEach((el) => el.addEventListener('input', renderPreview));
      row.querySelector('.del-row-btn').addEventListener('click', () => {
        row.remove();
        renderPreview();
      });
      list.appendChild(row);
      renderPreview();
    }

    addBtn.addEventListener('click', () => addRow());
    window.__addExpRow = addRow;
  }

  // ---------- Education Dynamic List ----------
  function initEducation() {
    const list = $('eduList');
    const addBtn = $('addEduBtn');
    const pContainer = $('pEduList');
    if (!list || !addBtn || !pContainer) return;

    function renderPreview() {
      const items = Array.from(list.children);
      if (!items.length) {
        pContainer.innerHTML = '<p class="p-item-desc" style="opacity:.6">هیچ بڕوانامەیەک زیاد نەکراوە.</p>';
        return;
      }
      pContainer.innerHTML = items
        .map((item) => {
          const degree = item.querySelector('.edu-degree')?.value.trim() || 'بڕوانامە';
          const school = item.querySelector('.edu-school')?.value.trim() || 'زانکۆ / پەیمانگا';
          const date = item.querySelector('.edu-date')?.value.trim() || '';
          return `
            <div class="p-item">
              <div class="p-item-head">
                <div class="p-item-role">${escapeHtml(degree)}</div>
                ${date ? `<div class="p-item-date">${escapeHtml(date)}</div>` : ''}
              </div>
              <div class="p-item-sub">${escapeHtml(school)}</div>
            </div>
          `;
        })
        .join('');
    }

    function addRow(degree = '', school = '', date = '') {
      const row = document.createElement('div');
      row.className = 'dyn-row';
      row.innerHTML = `
        <div class="dyn-grid">
          <input type="text" class="edu-degree" placeholder="بڕوانامە (وەک: بەکالۆریۆس لە زانستی کۆمپیوتەر)" value="${escapeAttr(degree)}">
          <input type="text" class="edu-school" placeholder="زانکۆ یان قوتابخانە" value="${escapeAttr(school)}">
          <input type="text" class="edu-date" placeholder="ساڵ (وەک: ٢٠١٨ - ٢٠٢٢)" value="${escapeAttr(date)}">
        </div>
        <button type="button" class="del-row-btn" title="سڕینەوە">✕ سڕینەوە</button>
      `;
      row.querySelectorAll('input').forEach((el) => el.addEventListener('input', renderPreview));
      row.querySelector('.del-row-btn').addEventListener('click', () => {
        row.remove();
        renderPreview();
      });
      list.appendChild(row);
      renderPreview();
    }

    addBtn.addEventListener('click', () => addRow());
    window.__addEduRow = addRow;
  }

  // ---------- Languages Dynamic List with levels ----------
  function initLanguages() {
    const list = $('langList');
    const addBtn = $('addLangBtn');
    const pContainer = $('pLangList');
    if (!list || !addBtn || !pContainer) return;

    function renderPreview() {
      const items = Array.from(list.children);
      if (!items.length) {
        pContainer.innerHTML = '<p class="p-item-desc" style="opacity:.6">هیچ زمانێک دیاری نەکراوە.</p>';
        return;
      }
      pContainer.innerHTML = items
        .map((item) => {
          const name = item.querySelector('.lang-name')?.value.trim() || 'زمان';
          const level = item.querySelector('.lang-level')?.value || '100';
          const levelLabel = level >= 90 ? 'دایک' : level >= 75 ? 'زۆر باش' : level >= 50 ? 'باش' : 'سەرەتایی';
          return `
            <div class="p-lang-item">
              <div class="p-lang-head">
                <span class="p-lang-name">${escapeHtml(name)}</span>
                <span class="p-lang-val">${levelLabel}</span>
              </div>
              <div class="p-lang-bar">
                <div class="p-lang-bar-fill" style="width:${level}%"></div>
              </div>
            </div>
          `;
        })
        .join('');
    }

    function addRow(name = '', level = '100') {
      const row = document.createElement('div');
      row.className = 'dyn-row';
      row.innerHTML = `
        <div class="dyn-grid" style="grid-template-columns: 2fr 1fr auto;">
          <input type="text" class="lang-name" placeholder="ناوی زمان (وەک: کوردی)" value="${escapeAttr(name)}">
          <select class="lang-level">
            <option value="100" ${level == '100' ? 'selected' : ''}>زمانی دایک (١٠٠٪)</option>
            <option value="85" ${level == '85' ? 'selected' : ''}>زۆر باش (٨٥٪)</option>
            <option value="65" ${level == '65' ? 'selected' : ''}>باش (٦٥٪)</option>
            <option value="40" ${level == '40' ? 'selected' : ''}>سەرەتایی (٤٠٪)</option>
          </select>
          <button type="button" class="del-row-btn" style="margin:0;">✕</button>
        </div>
      `;
      row.querySelectorAll('input, select').forEach((el) => el.addEventListener('input', renderPreview));
      row.querySelector('.del-row-btn').addEventListener('click', () => {
        row.remove();
        renderPreview();
      });
      list.appendChild(row);
      renderPreview();
    }

    addBtn.addEventListener('click', () => addRow());
    window.__addLangRow = addRow;
  }

  // ---------- Chip Inputs (Skills, Certs, References) ----------
  function initChipInputs() {
    const setup = (boxId, inputId, previewId, isTag = true) => {
      const box = $(boxId);
      const input = $(inputId);
      const preview = $(previewId);
      if (!box || !input || !preview) return;

      const getChips = () =>
        Array.from(box.querySelectorAll('.chip')).map((c) => c.dataset.val);

      const renderPreview = () => {
        const chips = getChips();
        if (!chips.length) {
          preview.innerHTML = `<span style="opacity:.5;font-size:12px">دیاری نەکراوە</span>`;
          return;
        }
        if (isTag) {
          preview.innerHTML = chips
            .map((c) => `<span class="p-tag">${escapeHtml(c)}</span>`)
            .join('');
        } else {
          preview.innerHTML = `<ul class="p-list">${chips
            .map((c) => `<li>${escapeHtml(c)}</li>`)
            .join('')}</ul>`;
        }
      };

      const addChip = (text) => {
        const val = (text || '').trim();
        if (!val) return;
        if (getChips().includes(val)) return;

        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.dataset.val = val;
        chip.innerHTML = `${escapeHtml(val)}<button type="button" aria-label="لابردن">✕</button>`;
        chip.querySelector('button').addEventListener('click', () => {
          chip.remove();
          renderPreview();
        });
        box.insertBefore(chip, input);
        renderPreview();
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          addChip(input.value);
          input.value = '';
        } else if (e.key === 'Backspace' && !input.value) {
          const last = box.querySelector('.chip:last-of-type');
          if (last) {
            last.remove();
            renderPreview();
          }
        }
      });

      return { addChip, clear: () => box.querySelectorAll('.chip').forEach((c) => c.remove()) };
    };

    window.__skillsApi = setup('skillsBox', 'skillsInput', 'pSkillsList', true);
    window.__certsApi = setup('certsBox', 'certsInput', 'pCertsList', false);
    window.__refsApi = setup('refsBox', 'refsInput', 'pRefsList', false);
  }

  // ---------- Profile Photo Editor & Upload ----------
  function initPhotoEditor() {
    const fileInput = $('photoInput');
    const previewImg = $('pPhoto');
    const removeBtn = $('removePhotoBtn');
    const shapeSelect = $('photoShape');
    const borderSelect = $('photoBorder');
    const zoomInput = $('photoZoom');
    const wrap = $('pPhotoWrap');

    if (!previewImg || !wrap) return;

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          alert('تکایە تەنها وێنە هەڵبژێرە');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        previewImg.src = DEFAULT_PHOTO_SRC;
        if (fileInput) fileInput.value = '';
      });
    }

    if (shapeSelect) {
      shapeSelect.addEventListener('change', () => {
        wrap.className = wrap.className
          .replace(/shape-\w+/g, '')
          .concat(` shape-${shapeSelect.value}`)
          .trim();
      });
    }

    if (borderSelect) {
      borderSelect.addEventListener('change', () => {
        wrap.className = wrap.className
          .replace(/border-\w+/g, '')
          .concat(` border-${borderSelect.value}`)
          .trim();
      });
    }

    if (zoomInput) {
      zoomInput.addEventListener('input', () => {
        const z = zoomInput.value || 100;
        previewImg.style.transform = `scale(${z / 100})`;
      });
    }
  }

  // ---------- Template Picker & Gallery Synchronization ----------
  function initTemplatePicker() {
    const paper = $('paper');
    const picker = $('templatePicker');
    if (!paper) return;

    const shapeButtons = picker ? picker.querySelectorAll('.shape-btn') : [];
    const colorRows = picker ? picker.querySelectorAll('.color-row') : [];
    const tplButtons = picker ? picker.querySelectorAll('.tpl-btn') : [];
    const STORAGE_KEY = 'cvTemplateChoice';

    function shapeOf(tpl) {
      if (!tpl) return 'classic';
      if (tpl.startsWith('sidebar') || tpl.startsWith('dark-sidebar')) return 'sidebar';
      if (tpl.startsWith('geometric') || tpl.startsWith('geo-')) return 'geometric';
      if (tpl.startsWith('overlap')) return 'overlap';
      if (tpl.startsWith('minimal') || tpl.startsWith('ats-')) return 'minimal';
      return 'classic';
    }

    function showShape(shape) {
      shapeButtons.forEach(b => b.classList.toggle('active', b.dataset.shape === shape));
      colorRows.forEach(r => r.classList.toggle('active', r.dataset.shapeGroup === shape));
    }

    function applyTemplate(tpl) {
      if (!tpl) tpl = 'gold';
      paper.dataset.tpl = tpl;
      tplButtons.forEach(b => b.classList.toggle('active', b.dataset.tpl === tpl));
      showShape(shapeOf(tpl));

      const badgeName = $('activeTplName');
      if (badgeName) {
        let found = null;
        if (window.CV_TEMPLATES) found = window.CV_TEMPLATES.find(t => t.id === tpl);
        badgeName.textContent = found ? found.name : tpl;
      }

      try { localStorage.setItem(STORAGE_KEY, tpl); } catch (e) {}
    }

    shapeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const shape = btn.dataset.shape;
        showShape(shape);
        const firstBtn = picker.querySelector(`.color-row[data-shape-group="${shape}"] .tpl-btn`);
        if (firstBtn) applyTemplate(firstBtn.dataset.tpl);
      });
    });

    tplButtons.forEach(btn => {
      btn.addEventListener('click', () => applyTemplate(btn.dataset.tpl));
    });

    const urlParams = new URLSearchParams(window.location.search);
    const urlTpl = urlParams.get('tpl');
    let saved = urlTpl || null;
    if (!saved) {
      try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    }

    if (saved) applyTemplate(saved);
    else applyTemplate('gold');
  }

  // ---------- Auto-save Form State before navigating to Template Gallery ----------
  function initFormPersistence() {
    const FORM_CACHE_KEY = 'kurdtech_cv_form_cache';
    const fields = ['fName', 'fTitle', 'fEmail', 'fPhone', 'fAddress', 'fSummary', 'fObjective'];

    function saveFields() {
      const data = {};
      fields.forEach(id => {
        const el = $(id);
        if (el) data[id] = el.value;
      });
      try { localStorage.setItem(FORM_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
    }

    function restoreFields() {
      try {
        const raw = localStorage.getItem(FORM_CACHE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        fields.forEach(id => {
          const el = $(id);
          if (el && data[id] !== undefined) {
            el.value = data[id];
            el.dispatchEvent(new Event('input'));
          }
        });
      } catch (e) {}
    }

    fields.forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('input', saveFields);
    });

    const openBtn = $('openGalleryBtn');
    if (openBtn) {
      openBtn.addEventListener('click', saveFields);
    }

    restoreFields();
  }

  // ---------- Modal Gallery Support ----------
  function initGallery() {
    const openBtn = $('openGalleryBtn');
    const overlay = $('galleryOverlay');
    const closeBtn = $('closeGalleryBtn');
    const sheet = overlay ? overlay.querySelector('.gallery-sheet') : null;
    const galleryItems = overlay ? overlay.querySelectorAll('.gallery-item') : [];
    const paper = $('paper');
    const STORAGE_KEY = 'cvTemplateChoice';

    if (!overlay) return;

    function open() {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      const current = paper.dataset.tpl || 'gold';
      galleryItems.forEach(card => card.classList.toggle('active', card.dataset.tpl === current));
    }

    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    galleryItems.forEach(card => {
      card.addEventListener('click', () => {
        const tpl = card.dataset.tpl;
        if (paper) paper.dataset.tpl = tpl;
        $$('.tpl-btn').forEach(b => b.classList.toggle('active', b.dataset.tpl === tpl));
        try { localStorage.setItem(STORAGE_KEY, tpl); } catch (e) {}
        close();
      });
    });
  }

  // ---------- PDF Export Engine ----------
  function initPdfExport() {
    const btn = $('downloadPdfBtn');
    const paper = $('paper');
    if (!btn || !paper) return;

    btn.addEventListener('click', async () => {
      if (typeof html2pdf === 'undefined') {
        window.print();
        return;
      }

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>خەریکی دروستکردنی PDF...</span>';

      const opt = {
        margin: [0, 0, 0, 0],
        filename: `${($('fName')?.value || 'CV').trim()}_KurdTech.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        await html2pdf().set(opt).from(paper).save();
      } catch (err) {
        console.error('PDF export failed, falling back to print:', err);
        window.print();
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }

  // ---------- Print Button ----------
  function initPrint() {
    const btn = $('printBtn');
    if (btn) btn.addEventListener('click', () => window.print());
  }

  // ---------- Utility Functions ----------
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  // ---------- Bootstrap System ----------
  initMirroring();
  initExperience();
  initEducation();
  initLanguages();
  initChipInputs();
  initPhotoEditor();
  initTemplatePicker();
  initFormPersistence();
  initGallery();
  initPdfExport();
  initPrint();

  // Initial demo data
  if (window.__addExpRow) {
    window.__addExpRow(
      'Senior Frontend Developer',
      'Kurd Technology Co.',
      '٢٠٢٢ - ئێستا',
      'سەرپەرشتیکردنی تیمی گەشەپێدەران و دیزاینکردنی وێبسایت و ئەپڵیکەیشنە مۆدێرنەکان.'
    );
  }
  if (window.__addEduRow) {
    window.__addEduRow('بەکالۆریۆس لە زانستی کۆمپیوتەر', 'زانکۆی سەلاحەدین', '٢٠١٧ - ٢٠٢١');
  }
  if (window.__addLangRow) {
    window.__addLangRow('کوردی', '100');
    window.__addLangRow('ئینگلیزی', '85');
    window.__addLangRow('عەرەبی', '65');
  }
  if (window.__skillsApi) {
    ['HTML5', 'CSS3 & Tailwind', 'JavaScript & TypeScript', 'React', 'Git & GitHub'].forEach(s =>
      window.__skillsApi.addChip(s)
    );
  }
})();
