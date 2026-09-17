(function () {
  'use strict';
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
    { keys: ['whatsapp', 'واتساپ'], label: 'WhatsApp', color: '#25D366', icon: '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="1.6"/>' }
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

  // ---------- Repeatable Sections ----------
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
    node.querySelector('.btn-remove').addEventListener('click', () => { node.remove(); renderKind(kind); });
    node.querySelectorAll('input, textarea').forEach(el => el.addEventListener('input', () => renderKind(kind)));
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

  // ---------- Achievements ----------
  function addAchievement() {
    const tpl = $('achievementsTpl');
    const list = $('achievementsList');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.btn-remove').addEventListener('click', () => { node.remove(); renderAchievements(); });
    node.querySelectorAll('input').forEach(el => el.addEventListener('input', renderAchievements));
    list.appendChild(node);
    renderAchievements();
  }

  function renderAchievements() {
    const list = $('achievementsList');
    const target = $('pAchievements');
    const items = Array.from(list.querySelectorAll('.repeat-item'));
    target.innerHTML = '';
    if (!items.length) {
      target.innerHTML = '<span class="empty-hint">هیچ زانیارییەک زیاد نەکراوە</span>';
    } else {
      items.forEach(item => {
        const text = item.querySelector('.a-text').value.trim();
        if (!text) return;
        const year = item.querySelector('.a-year').value.trim();
        const li = document.createElement('li');
        li.innerHTML = escapeHtml(text) + (year ? ` <span class="a-year">(${escapeHtml(year)})</span>` : '');
        target.appendChild(li);
      });
    }
    updateOptionalSections();
  }

  function updateOptionalSections() {
    const fObjective = $('fObjective');
    if (fObjective) setSectionVisible('secObjective', fObjective.value.trim().length > 0);
    ['projects', 'volunteer', 'courses'].forEach(kind => {
      const cfg = KINDS[kind];
      const hasContent = $(cfg.listId).querySelectorAll('.repeat-item').length > 0;
      setSectionVisible(cfg.sectionId, hasContent);
    });
    const achList = $('achievementsList');
    if (achList) setSectionVisible('secAchievements', achList.querySelectorAll('.repeat-item').length > 0);
  }

  const manualToggleState = {};
  const contentState = {};

  function setSectionVisible(sectionId, hasContent) {
    contentState[sectionId] = hasContent;
    applySectionVisibility(sectionId);
  }

  function applySectionVisibility(sectionId) {
    const el = $(sectionId);
    if (!el) return;
    const userWantsIt = manualToggleState[sectionId] !== false;
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

  // ---------- Skills & Languages ----------
  const LEVEL_LABELS = { '5': 'زمانی دایک', '4': 'زۆر باش', '3': 'باش', '2': 'مامناوەند', '1': 'سەرەتایی' };
  const skillsData = [];
  const langsData = [];

  function renderSkills() {
    const chipsEl = $('skillChips');
    const previewEl = $('pSkills');
    chipsEl.innerHTML = ''; previewEl.innerHTML = '';
    if (!skillsData.length) { previewEl.innerHTML = '<span class="empty-hint">هیچ نییە</span>'; return; }
    skillsData.forEach((skill, i) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `${escapeHtml(skill)} <button type="button" class="chip-remove">✕</button>`;
      chip.querySelector('.chip-remove').addEventListener('click', () => { skillsData.splice(i, 1); renderSkills(); });
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
    input.value = ''; input.focus();
    renderSkills();
  }

  function renderLangs() {
    const chipsEl = $('langChips');
    const previewEl = $('pLangs');
    chipsEl.innerHTML = ''; previewEl.innerHTML = '';
    if (!langsData.length) { previewEl.innerHTML = '<span class="empty-hint">هیچ نییە</span>'; return; }
    langsData.forEach((lang, i) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `${escapeHtml(lang.name)} <span class="lvl-tag">${LEVEL_LABELS[lang.level]}</span> <button type="button" class="chip-remove">✕</button>`;
      chip.querySelector('.chip-remove').addEventListener('click', () => { langsData.splice(i, 1); renderLangs(); });
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
    input.value = ''; input.focus();
    renderLangs();
  }

  function initChipInputs() {
    $('skillAddBtn').addEventListener('click', addSkill);
    $('skillInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } });
    $('langAddBtn').addEventListener('click', addLang);
    $('langInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addLang(); } });

    ['JavaScript', 'React', 'HTML/CSS', 'کارتیمی'].forEach(s => skillsData.push(s));
    langsData.push({ name: 'کوردی', level: '5' }, { name: 'ئینگلیزی', level: '4' }, { name: 'عەرەبی', level: '2' });
    renderSkills();
    renderLangs();
  }

  // ---------- Photo Editor ----------
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
    let img = null, baseScale = 1, userZoom = 1, offX = 0, offY = 0, dragging = false, startX = 0, startY = 0, startOffX = 0, startOffY = 0;

    function clampOffsets() {
      const scale = baseScale * userZoom;
      offX = Math.max(Math.min(0, W - img.naturalWidth * scale), Math.min(0, offX));
      offY = Math.max(Math.min(0, H - img.naturalHeight * scale), Math.min(0, offY));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (!img) return;
      const scale = baseScale * userZoom;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, offX, offY, img.naturalWidth * scale, img.naturalHeight * scale);
      ctx.restore();
      if (pPhoto) {
        pPhoto.src = canvas.toDataURL('image/png');
        pPhoto.classList.add('has-img');
        if (pPhotoEmpty) pPhotoEmpty.style.display = 'none';
      }
    }

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const image = new Image();
        image.onload = () => {
          img = image;
          baseScale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
          userZoom = 1;
          offX = (W - img.naturalWidth * baseScale) / 2;
          offY = (H - img.naturalHeight * baseScale) / 2;
          zoomSlider.value = 1; zoomSlider.disabled = false;
          placeholder.classList.add('hidden'); removeBtn.classList.add('show');
          draw();
        };
        image.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    zoomSlider.addEventListener('input', () => { if (!img) return; userZoom = parseFloat(zoomSlider.value); clampOffsets(); draw(); });
    removeBtn.addEventListener('click', () => {
      img = null; ctx.clearRect(0, 0, W, H);
      placeholder.classList.remove('hidden'); removeBtn.classList.remove('show');
      zoomSlider.value = 1; zoomSlider.disabled = true;
      if (pPhoto) { pPhoto.src = ''; pPhoto.classList.remove('has-img'); }
      if (pPhotoEmpty) pPhotoEmpty.style.display = '';
    });

    frame.addEventListener('pointerdown', (e) => {
      if (!img) return; dragging = true;
      const p = 'touches' in e ? e.touches[0] : e;
      startX = p.clientX; startY = p.clientY; startOffX = offX; startOffY = offY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging || !img) return;
      const p = 'touches' in e ? e.touches[0] : e;
      offX = startOffX + (p.clientX - startX); offY = startOffY + (p.clientY - startY);
      clampOffsets(); draw();
    });
    window.addEventListener('pointerup', () => { dragging = false; });
  }

  // ============================================================
  // 75 TEMPLATES DATA ENGINE & 3-COLUMN MODAL GALLERY
  // ============================================================
  const ALL_TEMPLATES = [
    { id: 'kurd-flag', name: 'ئاڵای کوردستان', cat: 'kurd', accent: '#FDBA12', bg: 'flag' },
    { id: 'kurd-mountain', name: 'شاخەکانی کوردستان', cat: 'kurd', accent: '#0C7A3D', bg: 'nature' },
    { id: 'kurd-zagros', name: 'لوتکەی زاگرۆس', cat: 'kurd', accent: '#20457A', bg: 'nature' },
    { id: 'kurd-sunset', name: 'ئێوارەی هەڵگورد', cat: 'kurd', accent: '#F59E0B', bg: 'nature' },
    { id: 'kurd-spring', name: 'بەهاری هەورامان', cat: 'kurd', accent: '#10B981', bg: 'nature' },

    { id: 'dark-gold', name: 'تاریک و زێڕین', cat: 'dark', accent: '#FDBA12', bg: 'dark' },
    { id: 'dark-cyan', name: 'تاریک و سایان', cat: 'dark', accent: '#06B6D4', bg: 'dark' },
    { id: 'dark-emerald', name: 'تاریک و زمڕوتی', cat: 'dark', accent: '#10B981', bg: 'dark' },
    { id: 'dark-blue', name: 'تاریک و شین', cat: 'dark', accent: '#38BDF8', bg: 'dark' },
    { id: 'dark-purple', name: 'تاریک و مۆری شاهانە', cat: 'dark', accent: '#C084FC', bg: 'dark' },
    { id: 'dark-crimson', name: 'تاریک و سوور', cat: 'dark', accent: '#FB7185', bg: 'dark' },
    { id: 'dark-amber', name: 'تاریک و کەهرەبایی', cat: 'dark', accent: '#FBBF24', bg: 'dark' },
    { id: 'dark-titanium', name: 'تاریک و تایتانیۆم', cat: 'dark', accent: '#94A3B8', bg: 'dark' },
    { id: 'dark-sidebar-gold', name: 'سایدباری ڕەش و زێڕین', cat: 'dark', accent: '#FDBA12', bg: 'dark-side' },
    { id: 'dark-sidebar-cyan', name: 'سایدباری ڕەش و سایان', cat: 'dark', accent: '#06B6D4', bg: 'dark-side' },

    { id: 'sidebar', name: 'سایدباری کلاسیک', cat: 'sidebar', accent: '#FDBA12', bg: 'side' },
    { id: 'sidebar-maroon', name: 'سایدباری مەڕۆن', cat: 'sidebar', accent: '#881337', bg: 'side' },
    { id: 'sidebar-forest', name: 'سایدباری سەوزی دارستان', cat: 'sidebar', accent: '#065F46', bg: 'side' },
    { id: 'sidebar-teal', name: 'سایدباری شینی دەریایی', cat: 'sidebar', accent: '#115E59', bg: 'side' },
    { id: 'sidebar-navy', name: 'سایدباری نیلی', cat: 'sidebar', accent: '#0369A1', bg: 'side' },
    { id: 'sidebar-emerald', name: 'سایدباری زمڕوتی', cat: 'sidebar', accent: '#064E3B', bg: 'side' },
    { id: 'sidebar-amber', name: 'سایدباری قاوەیی', cat: 'sidebar', accent: '#78350F', bg: 'side' },
    { id: 'sidebar-purple', name: 'سایدباری بەنەوشەیی', cat: 'sidebar', accent: '#6B21A8', bg: 'side' },
    { id: 'sidebar-crimson', name: 'سایدباری شەرابی', cat: 'sidebar', accent: '#881337', bg: 'side' },
    { id: 'sidebar-graphite', name: 'سایدباری گرافیتی', cat: 'sidebar', accent: '#334155', bg: 'side' },

    { id: 'geometric', name: 'ئەندازیاری شین', cat: 'geo', accent: '#2F6FED', bg: 'geo' },
    { id: 'geometric-purple', name: 'ئەندازیاری مۆر', cat: 'geo', accent: '#7C3AED', bg: 'geo' },
    { id: 'geometric-red', name: 'ئەندازیاری سوور', cat: 'geo', accent: '#DC2626', bg: 'geo' },
    { id: 'geometric-emerald', name: 'ئەندازیاری زمڕوتی', cat: 'geo', accent: '#059669', bg: 'geo' },
    { id: 'geo-cyan', name: 'ئەندازیاری سایان', cat: 'geo', accent: '#06B6D4', bg: 'geo' },
    { id: 'geo-amber', name: 'ئەندازیاری زێڕین', cat: 'geo', accent: '#F59E0B', bg: 'geo' },
    { id: 'geo-rose', name: 'ئەندازیاری ڕۆز', cat: 'geo', accent: '#F43F5E', bg: 'geo' },

    { id: 'overlap', name: 'کارتی ناوەند شین', cat: 'overlap', accent: '#14B8A6', bg: 'overlap' },
    { id: 'overlap-rose', name: 'کارتی ناوەند گوڵاوی', cat: 'overlap', accent: '#FB7185', bg: 'overlap' },
    { id: 'overlap-navy', name: 'کارتی ناوەند نیلی', cat: 'overlap', accent: '#1E40AF', bg: 'overlap' },
    { id: 'overlap-amber', name: 'کارتی ناوەند پرتەقاڵی', cat: 'overlap', accent: '#D97706', bg: 'overlap' },

    { id: 'grad-sunset', name: 'خۆرئاوابوون', cat: 'grad', accent: '#F97316', bg: 'grad' },
    { id: 'grad-aurora', name: 'ئاورۆرا', cat: 'grad', accent: '#10B981', bg: 'grad' },
    { id: 'grad-twilight', name: 'توایلایت', cat: 'grad', accent: '#6366F1', bg: 'grad' },
    { id: 'grad-royal', name: 'شاهانە', cat: 'grad', accent: '#A855F7', bg: 'grad' },
    { id: 'grad-ocean', name: 'زەریا', cat: 'grad', accent: '#0284C7', bg: 'grad' },
    { id: 'grad-flame', name: 'گڕی ئاگر', cat: 'grad', accent: '#EF4444', bg: 'grad' },

    { id: 'med-cyan', name: 'پزیشکی شین', cat: 'corp', accent: '#0891B2', bg: 'classic' },
    { id: 'med-green', name: 'پزیشکی سەوز', cat: 'corp', accent: '#059669', bg: 'classic' },
    { id: 'corp-navy', name: 'بەڕێوەبەری نیلی', cat: 'corp', accent: '#1E3A8A', bg: 'classic' },
    { id: 'corp-slate', name: 'ڕاوێژکاری دارایی', cat: 'corp', accent: '#475569', bg: 'classic' },
    { id: 'corp-maroon', name: 'ئەکادیمی', cat: 'corp', accent: '#881337', bg: 'classic' },
    { id: 'corp-bronze', name: 'بازرگانی برۆنزی', cat: 'corp', accent: '#B45309', bg: 'classic' },
    { id: 'corp-teal', name: 'تەلارسازی', cat: 'corp', accent: '#0D9488', bg: 'classic' },
    { id: 'ats-classic', name: 'ستانداردی ATS ڕەش', cat: 'corp', accent: '#000000', bg: 'minimal' },
    { id: 'ats-blue', name: 'ستانداردی ATS شین', cat: 'corp', accent: '#1D4ED8', bg: 'minimal' },
    { id: 'ats-emerald', name: 'ستانداردی ATS سەوز', cat: 'corp', accent: '#047857', bg: 'minimal' },

    { id: 'gold', name: 'کلاسیک زێڕین', cat: 'classic', accent: '#FDBA12', bg: 'classic' },
    { id: 'blue', name: 'کلاسیک شین', cat: 'classic', accent: '#5B9BFF', bg: 'classic' },
    { id: 'green', name: 'کلاسیک سەوز', cat: 'classic', accent: '#4ADE80', bg: 'classic' },
    { id: 'purple', name: 'کلاسیک مۆر', cat: 'classic', accent: '#A78BFA', bg: 'classic' },
    { id: 'red', name: 'کلاسیک سوور', cat: 'classic', accent: '#F87171', bg: 'classic' },
    { id: 'teal', name: 'کلاسیک دەریایی', cat: 'classic', accent: '#2DD4BF', bg: 'classic' },
    { id: 'rose', name: 'کلاسیک گوڵاوی', cat: 'classic', accent: '#FB7185', bg: 'classic' },
    { id: 'charcoal', name: 'کلاسیک زۆزمی', cat: 'classic', accent: '#94A3B8', bg: 'classic' },
    { id: 'orange', name: 'کلاسیک پرتەقاڵی', cat: 'classic', accent: '#FB923C', bg: 'classic' },
    { id: 'indigo', name: 'کلاسیک نیلی', cat: 'classic', accent: '#818CF8', bg: 'classic' },
    { id: 'emerald', name: 'کلاسیک زمڕوتی', cat: 'classic', accent: '#34D399', bg: 'classic' },
    { id: 'minimal', name: 'مینیمال ڕەش', cat: 'classic', accent: '#111111', bg: 'minimal' },
    { id: 'minimal-navy', name: 'مینیمال نیلی', cat: 'classic', accent: '#1B3A66', bg: 'minimal' }
  ];

  function buildTemplateThumb(tpl) {
    const isDark = tpl.id.startsWith('dark-');
    const isSide = tpl.bg.includes('side');
    const paperColor = isDark ? '#0F1523' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#1E293B';
    const lineMuted = isDark ? '#334155' : '#CBD5E1';

    if (tpl.id === 'kurd-flag') {
      return `
        <svg viewBox="0 0 160 210" class="thumb-svg">
          <rect width="160" height="210" fill="#FFFFFF"/>
          <rect y="0" width="160" height="18" fill="#CE1126"/>
          <rect y="18" width="160" height="18" fill="#FFFFFF"/>
          <rect y="36" width="160" height="18" fill="#0C7A3D"/>
          <circle cx="80" cy="27" r="9" fill="#FDBA12"/>
          <circle cx="130" cy="27" r="12" fill="#FFFFFF" stroke="#FDBA12" stroke-width="2"/>
          <rect x="15" y="70" width="80" height="5" rx="2" fill="#1E293B"/>
          <rect x="15" y="80" width="130" height="2" fill="#E2E8F0"/>
          <rect x="15" y="90" width="130" height="3" rx="1.5" fill="#94A3B8"/>
          <rect x="15" y="98" width="110" height="3" rx="1.5" fill="#94A3B8"/>
        </svg>
      `;
    }

    if (isSide) {
      const sideBg = isDark ? '#05070B' : (tpl.id === 'sidebar' ? '#161C2C' : tpl.accent);
      return `
        <svg viewBox="0 0 160 210" class="thumb-svg">
          <rect width="160" height="210" fill="${paperColor}"/>
          <rect x="105" y="0" width="55" height="210" fill="${sideBg}"/>
          <circle cx="132" cy="28" r="12" fill="${paperColor}" stroke="${tpl.accent}" stroke-width="2"/>
          <rect x="112" y="48" width="40" height="4" rx="2" fill="#FFFFFF"/>
          <rect x="10" y="20" width="85" height="6" rx="2" fill="${textColor}"/>
          <rect x="10" y="30" width="55" height="3" rx="1.5" fill="${tpl.accent}"/>
          <rect x="10" y="55" width="85" height="2" fill="${lineMuted}"/>
          <rect x="10" y="65" width="80" height="3" rx="1.5" fill="${lineMuted}"/>
          <rect x="10" y="73" width="70" height="3" rx="1.5" fill="${lineMuted}"/>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 160 210" class="thumb-svg">
        <rect width="160" height="210" fill="${paperColor}"/>
        <rect x="0" y="0" width="160" height="42" fill="${isDark ? '#070A11' : tpl.accent}"/>
        <circle cx="130" cy="21" r="11" fill="#FFFFFF" stroke="${tpl.accent}" stroke-width="2"/>
        <rect x="15" y="14" width="65" height="5" rx="2" fill="#FFFFFF"/>
        <rect x="25" y="23" width="45" height="3" rx="1.5" fill="${isDark ? tpl.accent : '#F1F5F9'}"/>
        <rect x="15" y="60" width="60" height="5" rx="2" fill="${textColor}"/>
        <rect x="15" y="70" width="130" height="2" fill="${lineMuted}"/>
        <rect x="15" y="78" width="130" height="3" rx="1.5" fill="${lineMuted}"/>
        <rect x="15" y="86" width="105" height="3" rx="1.5" fill="${lineMuted}"/>
      </svg>
    `;
  }

  function initFullModalGallery() {
    const grid = $('fullGalleryGrid');
    const paper = $('paper');
    const overlay = $('galleryOverlay');
    const openBtn = $('openGalleryBtn');
    const closeBtn = $('galleryCloseBtn');
    const doneBtn = $('galleryDoneBtn');
    const filterBtns = document.querySelectorAll('.gal-cat-btn');

    let activeFilter = 'all';

    function renderCards() {
      const current = paper.dataset.tpl || 'gold';
      const list = ALL_TEMPLATES.filter(t => activeFilter === 'all' || t.cat === activeFilter);

      grid.innerHTML = list.map(tpl => {
        const isSel = tpl.id === current;
        return `
          <div class="modal-tpl-card ${isSel ? 'active' : ''}" data-tpl-id="${tpl.id}">
            <div class="modal-tpl-preview">
              ${buildTemplateThumb(tpl)}
              ${isSel ? '<span class="sel-check">✓ هەڵبژێردراو</span>' : ''}
            </div>
            <div class="modal-tpl-info">
              <span class="tpl-dot" style="background:${tpl.accent}"></span>
              <span class="tpl-label">${escapeHtml(tpl.name)}</span>
            </div>
          </div>
        `;
      }).join('');

      grid.querySelectorAll('.modal-tpl-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.tplId;
          paper.dataset.tpl = id;
          try { localStorage.setItem('cvTemplateChoice', id); } catch(e){}
          renderCards();
          setTimeout(() => { overlay.classList.remove('open'); }, 200);
        });
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.cat;
        renderCards();
      });
    });

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        overlay.classList.add('open');
        renderCards();
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    if (doneBtn) doneBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

    let saved = null;
    try { saved = localStorage.getItem('cvTemplateChoice'); } catch(e){}
    if (saved) paper.dataset.tpl = saved;
  }

  // ---------- Action Buttons ----------
  document.querySelectorAll('[data-add]').forEach(btn => {
    const kind = btn.getAttribute('data-add');
    btn.addEventListener('click', () => {
      if (kind === 'achievements') addAchievement();
      else if (kind === 'links') addLinkItem();
      else addRepeatItem(kind);
    });
  });

  $('printBtn').addEventListener('click', () => window.print());

  const imageBtn = $('imageBtn');
  if (imageBtn) {
    imageBtn.addEventListener('click', () => {
      if (typeof html2canvas === 'undefined') {
        alert('ئامرازی وێنەگرتن بارنەبووە، تکایە پەیوەندیت بە ئینتەرنێت بپشکنە.');
        return;
      }
      const paper = $('paper');
      const original = imageBtn.innerHTML;
      imageBtn.disabled = true; imageBtn.innerHTML = '...';
      html2canvas(paper, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
        .then((canvas) => {
          const a = document.createElement('a');
          a.download = ($('fName').value || 'CV').trim().replace(/\s+/g, '-') + '.png';
          a.href = canvas.toDataURL('image/png');
          a.click();
        })
        .finally(() => {
          imageBtn.disabled = false; imageBtn.innerHTML = original;
        });
    });
  }

  // ---------- Initialization ----------
  bindSimple();
  initSectionToggles();
  initChipInputs();
  initPhotoEditor();
  initFullModalGallery();

  // Demo Initial Data
  addRepeatItem('experience');
  const firstExp = $('experienceList').querySelector('.repeat-item');
  firstExp.querySelector('.e-role').value = 'گەشەپێدەری وێب';
  firstExp.querySelector('.e-company').value = 'کۆمپانیای TechKurd';
  firstExp.querySelector('.e-dates').value = '٢٠٢٣ - ئێستا';
  firstExp.querySelector('.e-desc').value = 'دروستکردن و چاککردنی ماڵپەڕ بە React و Tailwind، هاوکاری لەگەڵ تیمی دیزاین.';
  renderKind('experience');

  addRepeatItem('education');
  const firstEdu = $('educationList').querySelector('.repeat-item');
  firstEdu.querySelector('.d-degree').value = 'بەکالۆریۆس زانستی کۆمپیوتەر';
  firstEdu.querySelector('.d-school').value = 'زانکۆی سەلاحەددین';
  firstEdu.querySelector('.d-dates').value = '٢٠١٩ - ٢٠٢٣';
  renderKind('education');

  updateOptionalSections();
})();
