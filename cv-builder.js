(function () {
  const $ = (id) => document.getElementById(id);

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Simple text fields -> live preview ----------
  const simpleBindings = [
    ['fName', 'pName'],
    ['fTitle', 'pTitle'],
    ['fPhone', 'pPhone'],
    ['fEmail', 'pEmail'],
    ['fCity', 'pCity'],
    ['fSummary', 'pSummary'],
    ['fObjective', 'pObjective']
  ];

  function bindSimple() {
    simpleBindings.forEach(([inputId, outId]) => {
      const input = $(inputId);
      const out = $(outId);
      if (!input || !out) return;
      const sync = () => { out.textContent = input.value.trim() || out.dataset.placeholder || ''; };
      out.dataset.placeholder = out.textContent;
      input.addEventListener('input', () => { sync(); updateOptionalSections(); });
      sync();
    });
  }

  // ---------- Smart social links ----------
  const PLATFORM_MAP = [
    { keys: ['tiktok', 'tik tok', 'تیکتۆک'], label: 'TikTok', color: '#000000', icon: '<path d="M16 3c.3 2 1.8 3.6 4 4v3.2c-1.5 0-2.9-.4-4-1.2v6.4A5.6 5.6 0 1 1 10.6 9.8v3.4a2.2 2.2 0 1 0 2.2 2.2V3H16z"/>' },
    { keys: ['instagram', 'insta', 'ئینستاگرام'], label: 'Instagram', color: '#C13584', icon: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1"/>' },
    { keys: ['facebook', 'fb', 'فەیسبووک'], label: 'Facebook', color: '#1877F2', icon: '<path d="M14 21v-7h2.4l.4-3H14V9c0-.9.2-1.5 1.6-1.5H17V5c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2V11H8v3h2.5v7H14z"/>' },
    { keys: ['x.com', 'twitter', 'ئێکس'], label: 'X', color: '#000000', icon: '<path d="M4 4l16 16M20 4L4 20" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>' },
    { keys: ['linkedin', 'لینکدئین'], label: 'LinkedIn', color: '#0A66C2', icon: '<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="8.5" r="1.2"/><line x1="8" y1="11.5" x2="8" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 17v-3.5c0-1.4 1-2.2 2.2-2.2s2 .8 2 2.2V17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
    { keys: ['github', 'گیتهەب'], label: 'GitHub', color: '#181717', icon: '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.7-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.71 1.03 1.6 1.03 2.7 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .26.18.58.69.48A10 10 0 0 0 12 2z"/>' },
    { keys: ['youtube', 'یوتیوب'], label: 'YouTube', color: '#FF0000', icon: '<rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 9l6 3-6 3z"/>' },
    { keys: ['telegram', 'تلگرام'], label: 'Telegram', color: '#26A5E4', icon: '<path d="M21 4 3 11l6 2m12-9-3.5 16-8.5-6m12-10L9.5 13"/>' },
    { keys: ['snapchat', 'سنابچات'], label: 'Snapchat', color: '#111111', icon: '<path d="M12 4c2.8 0 4.4 2 4.4 4.6 0 1 0 2.3.3 3 .3.6 1 1 1.8 1.2-.1.6-1 1-1.7 1.2 0 .5-.2 1.4-.7 1.7-.6.4-1.7.1-2.4.4-.7.3-1 1.3-1.7 1.3s-1-1-1.7-1.3c-.7-.3-1.8 0-2.4-.4-.5-.3-.7-1.2-.7-1.7-.7-.2-1.6-.6-1.7-1.2.8-.2 1.5-.6 1.8-1.2.3-.7.3-2 .3-3C7.6 6 9.2 4 12 4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' },
    { keys: ['whatsapp', 'واتساپ'], label: 'WhatsApp', color: '#25D366', icon: '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 8.8c.2-.6.5-.6.8-.6h.5c.2 0 .4 0 .6.5l.6 1.5c.1.2 0 .4-.1.6l-.4.5c-.1.2-.1.3 0 .5.5 1 1.3 1.7 2.3 2.1.2.1.3.1.5-.1l.5-.6c.1-.2.3-.2.5-.1l1.4.7c.2.1.3.2.3.4 0 1-1.2 1.7-2.1 1.7-2.6 0-5.4-2.8-5.4-5.4 0-.4 0-.7.1-1.1z"/>' },
    { keys: ['pinterest', 'پینتریست'], label: 'Pinterest', color: '#E60023', icon: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 18c.4-1.6 1-4.1 1.4-5.8m2.6-3.7a2.4 2.4 0 1 1 3 2.3c-.2 1.7-1 3-2.3 3-1 0-1.6-.6-1.4-1.6.2-1 .7-2.1.7-2.9 0-.7-.4-1.3-1.1-1.3-.9 0-1.6 1-1.6 2.3 0 .8.2 1.4.2 1.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
    { keys: ['behance', 'بیهانس'], label: 'Behance', color: '#1769FF', icon: '<text x="4" y="17" font-size="13" font-weight="700" fill="currentColor">Bē</text>' }
  ];
  const DEFAULT_PLATFORM = { label: 'لینک', color: '#6B7280', icon: '<path d="M9.5 14.5l5-5m-4-1.5 1-1a3.5 3.5 0 0 1 5 5l-1 1m-6.5 1.5-1 1a3.5 3.5 0 0 1-5-5l1-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' };

  function detectPlatform(name) {
    const n = (name || '').trim().toLowerCase();
    if (!n) return DEFAULT_PLATFORM;
    const found = PLATFORM_MAP.find(p => p.keys.some(k => n.includes(k)));
    return found || { ...DEFAULT_PLATFORM, label: name.trim() };
  }

  function addLinkItem() {
    const tpl = $('linksTpl');
    const list = $('linksList');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.btn-remove').addEventListener('click', () => { node.remove(); renderLinks(); });
    node.querySelectorAll('input').forEach(el => el.addEventListener('input', renderLinks));
    list.appendChild(node);
    renderLinks();
  }

  function renderLinks() {
    const list = $('linksList');
    const target = $('pLinks');
    const items = Array.from(list.querySelectorAll('.repeat-item'));
    target.innerHTML = '';

    items.forEach(item => {
      const name = item.querySelector('.l-name').value.trim();
      let url = item.querySelector('.l-url').value.trim();
      if (!name || !url) return;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      const platform = detectPlatform(name);

      const a = document.createElement('a');
      a.className = 'p-link-chip';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.style.setProperty('--link-color', platform.color);
      a.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">${platform.icon}</svg><span>${escapeHtml(platform.label)}</span>`;
      target.appendChild(a);
    });
  }

  // ---------- Repeatable sections: config-driven ----------
  // Each kind clones its <template>, wires remove/inputs, and re-renders
  // its own preview list whenever anything in it changes.
  const KINDS = {
    experience: {
      tplId: 'experienceTpl', listId: 'experienceList', previewId: 'pExperience',
      render(item) {
        const role = item.querySelector('.e-role').value.trim() || 'ناونیشانی کار';
        const company = item.querySelector('.e-company').value.trim();
        const dates = item.querySelector('.e-dates').value.trim();
        const desc = item.querySelector('.e-desc').value.trim();
        return `
          <div class="p-item-head">
            <span class="p-item-role">${escapeHtml(role)}${company ? ' — ' + escapeHtml(company) : ''}</span>
            <span class="p-item-dates">${escapeHtml(dates)}</span>
          </div>
          ${desc ? `<div class="p-item-desc">${escapeHtml(desc)}</div>` : ''}`;
      }
    },
    education: {
      tplId: 'educationTpl', listId: 'educationList', previewId: 'pEducation',
      render(item) {
        const degree = item.querySelector('.d-degree').value.trim() || 'بڕوانامە';
        const school = item.querySelector('.d-school').value.trim();
        const dates = item.querySelector('.d-dates').value.trim();
        return `
          <div class="p-item-head">
            <span class="p-item-role">${escapeHtml(degree)}</span>
            <span class="p-item-dates">${escapeHtml(dates)}</span>
          </div>
          ${school ? `<div class="p-item-sub">${escapeHtml(school)}</div>` : ''}`;
      }
    },
    projects: {
      tplId: 'projectsTpl', listId: 'projectsList', previewId: 'pProjects', sectionId: 'secProjects',
      render(item) {
        const title = item.querySelector('.j-title').value.trim() || 'ناوی پڕۆژە';
        const link = item.querySelector('.j-link').value.trim();
        const desc = item.querySelector('.j-desc').value.trim();
        return `
          <div class="p-item-head">
            <span class="p-item-role">${escapeHtml(title)}</span>
            ${link ? `<a class="p-item-dates" href="${escapeHtml(/^https?:\/\//i.test(link) ? link : 'https://' + link)}" target="_blank" rel="noopener">لینک</a>` : ''}
          </div>
          ${desc ? `<div class="p-item-desc">${escapeHtml(desc)}</div>` : ''}`;
      }
    },
    volunteer: {
      tplId: 'volunteerTpl', listId: 'volunteerList', previewId: 'pVolunteer', sectionId: 'secVolunteer',
      render(item) {
        const role = item.querySelector('.v-role').value.trim() || 'ڕۆڵ';
        const org = item.querySelector('.v-org').value.trim();
        const dates = item.querySelector('.v-dates').value.trim();
        const desc = item.querySelector('.v-desc').value.trim();
        return `
          <div class="p-item-head">
            <span class="p-item-role">${escapeHtml(role)}${org ? ' — ' + escapeHtml(org) : ''}</span>
            <span class="p-item-dates">${escapeHtml(dates)}</span>
          </div>
          ${desc ? `<div class="p-item-desc">${escapeHtml(desc)}</div>` : ''}`;
      }
    },
    courses: {
      tplId: 'coursesTpl', listId: 'coursesList', previewId: 'pCourses', sectionId: 'secCourses',
      render(item) {
        const name = item.querySelector('.c-name').value.trim() || 'ناوی کۆرس';
        const org = item.querySelector('.c-org').value.trim();
        const year = item.querySelector('.c-year').value.trim();
        return `
          <div class="p-item-head">
            <span class="p-item-role">${escapeHtml(name)}</span>
            <span class="p-item-dates">${escapeHtml(year)}</span>
          </div>
          ${org ? `<div class="p-item-sub">${escapeHtml(org)}</div>` : ''}`;
      }
    }
  };

  function addRepeatItem(kind) {
    const cfg = KINDS[kind];
    const tpl = $(cfg.tplId);
    const list = $(cfg.listId);
    const node = tpl.content.firstElementChild.cloneNode(true);

    node.querySelector('.btn-remove').addEventListener('click', () => {
      node.remove();
      renderKind(kind);
    });
    node.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', () => renderKind(kind));
    });

    list.appendChild(node);
    renderKind(kind);
  }

  function renderKind(kind) {
    const cfg = KINDS[kind];
    const list = $(cfg.listId);
    const target = $(cfg.previewId);
    const items = Array.from(list.querySelectorAll('.repeat-item'));

    if (!items.length) {
      target.innerHTML = '<span class="empty-hint">هیچ زانیارییەک زیاد نەکراوە</span>';
    } else {
      target.innerHTML = '';
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-item';
        div.innerHTML = cfg.render(item);
        target.appendChild(div);
      });
    }
    updateOptionalSections();
  }

  // ---------- Achievements: a simple bullet-point list ----------
  function addAchievement() {
    const tpl = $('achievementsTpl');
    const list = $('achievementsList');
    const node = tpl.content.firstElementChild.cloneNode(true);

    node.querySelector('.btn-remove').addEventListener('click', () => {
      node.remove();
      renderAchievements();
    });
    node.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', renderAchievements);
    });

    list.appendChild(node);
    renderAchievements();
  }

  function renderAchievements() {
    const list = $('achievementsList');
    const target = $('pAchievements');
    const items = Array.from(list.querySelectorAll('.repeat-item'));

    if (!items.length) {
      target.innerHTML = '<span class="empty-hint">هیچ زانیارییەک زیاد نەکراوە</span>';
    } else {
      target.innerHTML = '';
      items.forEach(item => {
        const text = item.querySelector('.a-text').value.trim();
        if (!text) return;
        const year = item.querySelector('.a-year').value.trim();
        const li = document.createElement('li');
        li.innerHTML = escapeHtml(text) + (year ? ` <span class="a-year">(${escapeHtml(year)})</span>` : '');
        target.appendChild(li);
      });
      if (!target.children.length) {
        target.innerHTML = '<span class="empty-hint">هیچ زانیارییەک زیاد نەکراوە</span>';
      }
    }
    updateOptionalSections();
  }

  // ---------- Hide optional sections entirely when they have no content ----------
  function updateOptionalSections() {
    const fObjective = $('fObjective');
    if (fObjective) {
      setSectionVisible('secObjective', fObjective.value.trim().length > 0);
    }
    ['projects', 'volunteer', 'courses'].forEach(kind => {
      const cfg = KINDS[kind];
      const hasContent = $(cfg.listId).querySelectorAll('.repeat-item').length > 0;
      setSectionVisible(cfg.sectionId, hasContent);
    });
    const achList = $('achievementsList');
    if (achList) {
      setSectionVisible('secAchievements', achList.querySelectorAll('.repeat-item').length > 0);
    }
  }

  // ---------- Section visibility toggles ("show/hide on the CV, my choice") ----------
  const manualToggleState = {}; // sectionId -> user's checkbox choice (true = allowed to show)
  const contentState = {};      // sectionId -> whether it currently has content (only relevant for optional ones)

  function setSectionVisible(sectionId, hasContent) {
    contentState[sectionId] = hasContent;
    applySectionVisibility(sectionId);
  }

  function applySectionVisibility(sectionId) {
    const el = $(sectionId);
    if (!el) return;
    const userWantsIt = manualToggleState[sectionId] !== false; // default true
    const contentOk = sectionId in contentState ? contentState[sectionId] : true;
    el.hidden = !(userWantsIt && contentOk);
  }

  function initSectionToggles() {
    document.querySelectorAll('.sec-toggle').forEach(label => {
      const targetId = label.dataset.target;
      const checkbox = label.querySelector('input');
      manualToggleState[targetId] = checkbox.checked;
      checkbox.addEventListener('change', () => {
        manualToggleState[targetId] = checkbox.checked;
        applySectionVisibility(targetId);
      });
    });
  }

  // ---------- Skills & Languages: easy "type + add" chips ----------
  const LEVEL_LABELS = { '5': 'زمانی دایک', '4': 'زۆر باش', '3': 'باش', '2': 'مامناوەند', '1': 'سەرەتایی' };

  const skillsData = [];
  const langsData = []; // { name, level }

  function renderSkills() {
    const chipsEl = $('skillChips');
    const previewEl = $('pSkills');
    chipsEl.innerHTML = '';
    previewEl.innerHTML = '';

    if (!skillsData.length) {
      previewEl.innerHTML = '<span class="empty-hint">هیچ نییە</span>';
      return;
    }
    skillsData.forEach((skill, i) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `${escapeHtml(skill)} <button type="button" class="chip-remove" aria-label="سڕینەوە">✕</button>`;
      chip.querySelector('.chip-remove').addEventListener('click', () => {
        skillsData.splice(i, 1);
        renderSkills();
      });
      chipsEl.appendChild(chip);

      const tag = document.createElement('span');
      tag.className = 'p-tag';
      tag.textContent = skill;
      previewEl.appendChild(tag);
    });
  }

  function addSkill() {
    const input = $('skillInput');
    const val = input.value.trim();
    if (!val) return;
    skillsData.push(val);
    input.value = '';
    input.focus();
    renderSkills();
  }

  function renderLangs() {
    const chipsEl = $('langChips');
    const previewEl = $('pLangs');
    chipsEl.innerHTML = '';
    previewEl.innerHTML = '';

    if (!langsData.length) {
      previewEl.innerHTML = '<span class="empty-hint">هیچ نییە</span>';
      return;
    }
    langsData.forEach((lang, i) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `${escapeHtml(lang.name)} <span class="lvl-tag">${LEVEL_LABELS[lang.level]}</span> <button type="button" class="chip-remove" aria-label="سڕینەوە">✕</button>`;
      chip.querySelector('.chip-remove').addEventListener('click', () => {
        langsData.splice(i, 1);
        renderLangs();
      });
      chipsEl.appendChild(chip);

      const item = document.createElement('div');
      item.className = 'p-lang-item';
      item.innerHTML = `
        <div class="p-lang-name"><span>${escapeHtml(lang.name)}</span><small>${LEVEL_LABELS[lang.level]}</small></div>
        <div class="p-lang-bar"><div class="p-lang-fill" style="width:${lang.level * 20}%"></div></div>`;
      previewEl.appendChild(item);
    });
  }

  function addLang() {
    const input = $('langInput');
    const val = input.value.trim();
    if (!val) return;
    const level = $('langLevel').value;
    langsData.push({ name: val, level });
    input.value = '';
    input.focus();
    renderLangs();
  }

  function initChipInputs() {
    $('skillAddBtn').addEventListener('click', addSkill);
    $('skillInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } });
    $('langAddBtn').addEventListener('click', addLang);
    $('langInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addLang(); } });

    // seed with sensible defaults
    ['JavaScript', 'React', 'HTML/CSS', 'کارتیمی'].forEach(s => skillsData.push(s));
    langsData.push({ name: 'کوردی', level: '5' });
    langsData.push({ name: 'ئینگلیزی', level: '4' });
    langsData.push({ name: 'عەرەبی', level: '2' });
    renderSkills();
    renderLangs();
  }

  // ---------- Personal photo: drag-to-position + zoom, rendered via canvas ----------
  function initPhotoEditor() {
    const frame = $('photoFrame');
    const canvas = $('photoCanvas');
    const placeholder = $('photoPlaceholder');
    const removeBtn = $('photoRemove');
    const fileInput = $('photoInput');
    const zoomSlider = $('photoZoom');
    const pPhoto = $('pPhoto');
    const pPhotoEmpty = $('pPhotoEmpty');
    if (!frame || !canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    let img = null;
    let baseScale = 1;
    let userZoom = 1;
    let offX = 0, offY = 0;
    let dragging = false;
    let startX = 0, startY = 0, startOffX = 0, startOffY = 0;

    function clampOffsets() {
      const scale = baseScale * userZoom;
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const minX = Math.min(0, W - dw);
      const minY = Math.min(0, H - dh);
      offX = Math.max(minX, Math.min(0, offX));
      offY = Math.max(minY, Math.min(0, offY));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (!img) return;
      const scale = baseScale * userZoom;
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, offX, offY, dw, dh);
      ctx.restore();
      syncToPreview();
    }

    function syncToPreview() {
      if (!pPhoto) return;
      const url = canvas.toDataURL('image/png');
      pPhoto.src = url;
      pPhoto.classList.add('has-img');
      if (pPhotoEmpty) pPhotoEmpty.style.display = 'none';
    }

    function loadFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => {
          img = image;
          baseScale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
          userZoom = 1;
          offX = (W - img.naturalWidth * baseScale) / 2;
          offY = (H - img.naturalHeight * baseScale) / 2;
          zoomSlider.value = 1;
          zoomSlider.disabled = false;
          placeholder.classList.add('hidden');
          removeBtn.classList.add('show');
          draw();
        };
        image.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
    });

    zoomSlider.addEventListener('input', () => {
      if (!img) return;
      userZoom = parseFloat(zoomSlider.value);
      clampOffsets();
      draw();
    });

    removeBtn.addEventListener('click', () => {
      img = null;
      ctx.clearRect(0, 0, W, H);
      placeholder.classList.remove('hidden');
      removeBtn.classList.remove('show');
      zoomSlider.value = 1;
      zoomSlider.disabled = true;
      if (pPhoto) { pPhoto.src = ''; pPhoto.classList.remove('has-img'); }
      if (pPhotoEmpty) pPhotoEmpty.style.display = '';
    });

    function pointerDown(e) {
      if (!img) return;
      dragging = true;
      const p = 'touches' in e ? e.touches[0] : e;
      startX = p.clientX; startY = p.clientY;
      startOffX = offX; startOffY = offY;
    }
    function pointerMove(e) {
      if (!dragging || !img) return;
      const p = 'touches' in e ? e.touches[0] : e;
      offX = startOffX + (p.clientX - startX);
      offY = startOffY + (p.clientY - startY);
      clampOffsets();
      draw();
      e.preventDefault();
    }
    function pointerUp() { dragging = false; }

    frame.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove, { passive: false });
    window.addEventListener('pointerup', pointerUp);
  }

  // ---------- Template picker (shape + color, inside the design gallery) ----------
  function initTemplatePicker() {
    const paper = $('paper');
    const picker = $('templatePicker');
    if (!paper || !picker) return;

    const shapeButtons = picker.querySelectorAll('.shape-btn');
    const colorRows = picker.querySelectorAll('.color-row');
    const tplButtons = picker.querySelectorAll('.tpl-btn');
    const STORAGE_KEY = 'cvTemplateChoice';

    function shapeOf(tpl) {
      if (tpl.startsWith('sidebar')) return 'sidebar';
      if (tpl.startsWith('geometric')) return 'geometric';
      if (tpl.startsWith('overlap')) return 'overlap';
      if (tpl.startsWith('minimal')) return 'minimal';
      return 'classic';
    }

    function showShape(shape) {
      shapeButtons.forEach(b => b.classList.toggle('active', b.dataset.shape === shape));
      colorRows.forEach(row => { row.hidden = row.dataset.shapeGroup !== shape; });
    }

    function applyTemplate(tpl) {
      paper.dataset.tpl = tpl;
      tplButtons.forEach(b => b.classList.toggle('active', b.dataset.tpl === tpl));
      showShape(shapeOf(tpl));
      try { localStorage.setItem(STORAGE_KEY, tpl); } catch (e) {}
    }

    shapeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const shape = btn.dataset.shape;
        showShape(shape);
        // jump straight to the first color option of the newly chosen shape
        const firstBtn = picker.querySelector(`.color-row[data-shape-group="${shape}"] .tpl-btn`);
        if (firstBtn) applyTemplate(firstBtn.dataset.tpl);
      });
    });

    tplButtons.forEach(btn => {
      btn.addEventListener('click', () => applyTemplate(btn.dataset.tpl));
    });

    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved) applyTemplate(saved);
    else showShape('classic');
  }

  // ---------- Design gallery: open/close the full-screen modal ----------
  function initGallery() {
    const openBtn = $('openGalleryBtn');
    const overlay = $('galleryOverlay');
    const closeBtn = $('galleryCloseBtn');
    const doneBtn = $('galleryDoneBtn');
    if (!openBtn || !overlay) return;

    function open() { overlay.classList.add('open'); }
    function close() { overlay.classList.remove('open'); }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    doneBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }

  // ---------- Wire up "add" buttons ----------
  document.querySelectorAll('[data-add]').forEach(btn => {
    const kind = btn.getAttribute('data-add');
    btn.addEventListener('click', () => {
      if (kind === 'achievements') addAchievement();
      else if (kind === 'links') addLinkItem();
      else addRepeatItem(kind);
    });
  });

  // ---------- Print ----------
  $('printBtn').addEventListener('click', () => window.print());

  // ---------- Download as image (PNG) ----------
  const imageBtn = $('imageBtn');
  if (imageBtn) {
    imageBtn.addEventListener('click', () => {
      if (typeof html2canvas === 'undefined') {
        alert('ئامرازی وێنەگرتن بارنەبووە، تکایە پەیوەندیت بە ئینتەرنێت بپشکنە و دووبارە هەوڵ بدەرەوە.');
        return;
      }
      const paper = $('paper');
      const originalLabel = imageBtn.innerHTML;
      imageBtn.disabled = true;
      imageBtn.innerHTML = '...';

      html2canvas(paper, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      }).then((canvas) => {
        const link = document.createElement('a');
        const name = ($('fName').value || 'CV').trim().replace(/\s+/g, '-');
        link.download = name + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(() => {
        alert('نەتوانرا وێنەکە دروست بکرێت، تکایە دووبارە هەوڵ بدەرەوە.');
      }).finally(() => {
        imageBtn.disabled = false;
        imageBtn.innerHTML = originalLabel;
      });
    });
  }

  // ---------- Init ----------
  bindSimple();
  initSectionToggles();
  initChipInputs();
  initPhotoEditor();
  initTemplatePicker();
  initGallery();

  // seed with one example experience + one example education so the
  // preview looks complete from the start
  addRepeatItem('experience');
  const firstExp = $('experienceList').querySelector('.repeat-item');
  firstExp.querySelector('.e-role').value = 'گەشەپێدەری وێب';
  firstExp.querySelector('.e-company').value = 'کۆمپانیای TechKurd';
  firstExp.querySelector('.e-dates').value = '٢٠٢٣ - ئێستا';
  firstExp.querySelector('.e-desc').value = 'دروستکردن و چاککردنی ماڵپەڕ بە بەکارهێنانی React و Node.js، هاوکاری لەگەڵ تیمی دیزاین بۆ باشترکردنی ئەزموونی بەکارهێنەر.';
  renderKind('experience');

  addRepeatItem('education');
  const firstEdu = $('educationList').querySelector('.repeat-item');
  firstEdu.querySelector('.d-degree').value = 'بەکالۆریۆس زانستی کۆمپیوتەر';
  firstEdu.querySelector('.d-school').value = 'زانکۆی سەلاحەددین';
  firstEdu.querySelector('.d-dates').value = '٢٠١٩ - ٢٠٢٣';
  renderKind('education');

  updateOptionalSections();
})();
