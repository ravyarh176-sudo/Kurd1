// Kurd Technology — admin panel: "بەڕێوەبردنی بەشەکان" (manage homepage sections).
// Only ever runs for the owner (guard.js + the check below both enforce this;
// the real protection is the Supabase RLS policies on site_sections).

window.addEventListener('kurdtech:ready', async () => {
  const supabase = window.kurdtechSupabase;
  const myProfile = window.kurdtechProfile;
  if (!myProfile || myProfile.role !== 'owner') return; // admin.js already redirects non-owners

  const $ = (id) => document.getElementById(id);
  const ICONS = window.KURDTECH_ICONS || {};

  const STYLE_PRESETS = [
    { key: 'games',    color: '#4B3A93', label: 'مۆر' },
    { key: 'cv',       color: '#3E5988', label: 'شین' },
    { key: 'jobs',     color: '#0E6E5E', label: 'سەوزی تۆخ' },
    { key: 'ai',       color: '#3B2E70', label: 'مۆری تۆخ' },
    { key: 'design',   color: '#7A5426', label: 'قاوەیی' },
    { key: 'courses',  color: '#1F6B45', label: 'سەوز' },
    { key: 'media',    color: '#23507F', label: 'شینی تۆخ' },
    { key: 'code',     color: '#6B6321', label: 'زەیتوونی' },
    { key: 'custom',   color: '#F5B800', label: 'ڕەنگی خۆت' }
  ];

  let sections = [];
  let editingId = null;      // null = adding a new section
  let selectedIcon = 'star';
  let selectedStyle = 'games';
  let selectedColor = '#4B3A93';

  // ---------------- Top-level tabs: Users / Sections ----------------
  $('topTabUsers').addEventListener('click', () => {
    $('topTabUsers').classList.add('active');
    $('topTabSections').classList.remove('active');
    $('usersPanel').hidden = false;
    $('sectionsPanel').hidden = true;
  });
  $('topTabSections').addEventListener('click', () => {
    $('topTabSections').classList.add('active');
    $('topTabUsers').classList.remove('active');
    $('sectionsPanel').hidden = false;
    $('usersPanel').hidden = true;
    if (!sections.length) loadSections();
  });

  // ---------------- Load + render the list ----------------
  async function loadSections() {
    $('sectionsList').innerHTML = '<div class="loading-hint">بارکردن...</div>';
    const { data, error } = await supabase
      .from('site_sections')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      $('sectionsList').innerHTML = '<div class="loading-hint">نەتوانرا بەشەکان بار بکرێن</div>';
      return;
    }
    sections = data || [];
    renderList();
  }

  function renderList() {
    const list = $('sectionsList');
    if (!sections.length) {
      list.innerHTML = '<div class="loading-hint">هیچ بەشێک نییە — یەکێک زیاد بکە</div>';
      return;
    }
    list.innerHTML = '';
    sections.forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'section-row';
      row.innerHTML = `
        <div class="section-row-order">
          <button type="button" class="order-btn" data-dir="up" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button type="button" class="order-btn" data-dir="down" ${i === sections.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <div class="section-row-icon" style="background:${s.color || '#333'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[s.icon] || ICONS.star}</svg>
        </div>
        <div class="section-row-info">
          <div class="section-row-title">${escapeHtml(s.title)}</div>
          <div class="section-row-sub">${s.is_visible ? 'پیشاندراو' : 'شاراوە'}</div>
        </div>
        <button type="button" class="section-row-edit" data-act="edit">دەستکاری</button>
        <button type="button" class="section-row-del" data-act="delete">🗑️</button>
      `;
      row.querySelector('[data-dir="up"]').addEventListener('click', () => moveSection(i, -1));
      row.querySelector('[data-dir="down"]').addEventListener('click', () => moveSection(i, 1));
      row.querySelector('[data-act="edit"]').addEventListener('click', () => openForm(s));
      row.querySelector('[data-act="delete"]').addEventListener('click', () => confirmDelete(s));
      list.appendChild(row);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ---------------- Reorder (swap sort_order with the neighbor) ----------------
  async function moveSection(index, dir) {
    const other = index + dir;
    if (other < 0 || other >= sections.length) return;
    const a = sections[index], b = sections[other];
    const aOrder = a.sort_order, bOrder = b.sort_order;

    [sections[index], sections[other]] = [sections[other], sections[index]];
    renderList();

    await Promise.all([
      supabase.from('site_sections').update({ sort_order: bOrder }).eq('id', a.id),
      supabase.from('site_sections').update({ sort_order: aOrder }).eq('id', b.id)
    ]);
  }

  // ---------------- Add / Edit form ----------------
  function buildIconPicker() {
    const wrap = $('iconPicker');
    wrap.innerHTML = '';
    Object.keys(ICONS).forEach(key => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-opt';
      btn.dataset.icon = key;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[key]}</svg>`;
      btn.addEventListener('click', () => {
        selectedIcon = key;
        wrap.querySelectorAll('.icon-opt').forEach(b => b.classList.toggle('active', b.dataset.icon === key));
      });
      wrap.appendChild(btn);
    });
  }

  function buildStylePicker() {
    const wrap = $('stylePicker');
    wrap.innerHTML = '';
    STYLE_PRESETS.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'style-opt';
      btn.dataset.style = p.key;
      btn.innerHTML = `<span class="style-swatch" style="background:${p.color}"></span>${p.label}`;
      btn.addEventListener('click', () => {
        selectedStyle = p.key;
        selectedColor = p.key === 'custom' ? $('sfCustomColor').value : p.color;
        wrap.querySelectorAll('.style-opt').forEach(b => b.classList.toggle('active', b.dataset.style === p.key));
        $('customColorRow').hidden = p.key !== 'custom';
      });
      wrap.appendChild(btn);
    });
  }

  function refreshPickerSelection() {
    $('iconPicker').querySelectorAll('.icon-opt').forEach(b => b.classList.toggle('active', b.dataset.icon === selectedIcon));
    $('stylePicker').querySelectorAll('.style-opt').forEach(b => b.classList.toggle('active', b.dataset.style === selectedStyle));
    $('customColorRow').hidden = selectedStyle !== 'custom';
    $('sfCustomColor').value = selectedColor;
  }

  function openForm(section) {
    editingId = section ? section.id : null;
    $('sectionFormTitle').textContent = section ? 'دەستکاریکردنی بەش' : 'زیادکردنی بەشی نوێ';
    $('sfTitle').value = section ? section.title : '';
    $('sfDescription').value = section ? (section.description || '') : '';
    $('sfLink').value = section ? (section.link || '') : '';
    $('sfImage').value = section ? (section.image_url || '') : '';
    $('sfVisible').checked = section ? !!section.is_visible : true;
    selectedIcon = section ? (section.icon || 'star') : 'star';
    selectedStyle = section ? (section.card_style || 'games') : 'games';
    selectedColor = section ? (section.color || '#4B3A93') : '#4B3A93';
    refreshPickerSelection();
    $('sectionFormOverlay').classList.add('open');
  }
  function closeForm() { $('sectionFormOverlay').classList.remove('open'); }

  $('addSectionBtn').addEventListener('click', () => openForm(null));
  $('sectionFormClose').addEventListener('click', closeForm);
  $('sectionFormOverlay').addEventListener('click', (e) => { if (e.target.id === 'sectionFormOverlay') closeForm(); });

  $('sfCustomColor').addEventListener('input', () => {
    if (selectedStyle === 'custom') selectedColor = $('sfCustomColor').value;
  });

  $('sectionSaveBtn').addEventListener('click', async () => {
    const title = $('sfTitle').value.trim();
    if (!title) { alert('تکایە ناوی بەشەکە بنووسە.'); return; }

    const payload = {
      title,
      description: $('sfDescription').value.trim(),
      link: $('sfLink').value.trim() || '#',
      image_url: $('sfImage').value.trim(),
      icon: selectedIcon,
      card_style: selectedStyle,
      color: selectedColor,
      is_visible: $('sfVisible').checked
    };

    const btn = $('sectionSaveBtn');
    btn.disabled = true;
    btn.textContent = '...چاوەڕوان بە';

    try {
      if (editingId) {
        const { error } = await supabase.from('site_sections').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        payload.sort_order = sections.length ? Math.max(...sections.map(s => s.sort_order)) + 1 : 1;
        payload.created_by = window.kurdtechUser.id;
        const { error } = await supabase.from('site_sections').insert(payload);
        if (error) throw error;
      }
      closeForm();
      await loadSections();
    } catch (err) {
      alert('هەڵەیەک ڕوویدا: ' + (err.message || ''));
    } finally {
      btn.disabled = false;
      btn.textContent = 'پاشەکەوتکردن';
    }
  });

  // ---------------- Delete (with the shared confirm dialog) ----------------
  function confirmDelete(section) {
    $('confirmMessage').textContent = `دڵنیایت دەتەوێت "${section.title}" بسڕیتەوە؟`;
    $('confirmOverlay').classList.add('open');

    const yesBtn = $('confirmYesBtn');
    const noBtn = $('confirmNoBtn');
    const cleanup = () => {
      $('confirmOverlay').classList.remove('open');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
    };
    const onYes = async () => {
      await supabase.from('site_sections').delete().eq('id', section.id);
      cleanup();
      loadSections();
    };
    const onNo = () => cleanup();

    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  }

  buildIconPicker();
  buildStylePicker();
});
