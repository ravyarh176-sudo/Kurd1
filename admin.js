// Kurd Technology — admin dashboard (owner only).

window.addEventListener('kurdtech:ready', async () => {
  const supabase = window.kurdtechSupabase;
  const me = window.kurdtechUser;
  const myProfile = window.kurdtechProfile;

  if (!myProfile || myProfile.role !== 'owner') {
    window.location.href = 'services.html';
    return;
  }

  const $ = (id) => document.getElementById(id);
  let allUsers = [];
  let activeUser = null;

  function initials(name) {
    return (name || '؟').trim().charAt(0).toUpperCase();
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, banned, ban_reason, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      $('userList').innerHTML = `<div class="loading-hint">نەتوانرا بەکارهێنەران بار بکرێن</div>`;
      return;
    }

    allUsers = data || [];
    renderStats();
    renderList();
  }

  function renderStats() {
    if ($('statTotal')) $('statTotal').textContent = allUsers.length;
    if ($('statBanned')) $('statBanned').textContent = allUsers.filter(u => u.banned).length;
    if ($('statOwners')) $('statOwners').textContent = allUsers.filter(u => u.role === 'owner').length;
  }

  function renderList() {
    const list = $('userList');
    if (!list) return;

    if (!allUsers.length) {
      list.innerHTML = `<div class="loading-hint">هیچ بەکارهێنەرێک نییە</div>`;
      return;
    }

    list.innerHTML = allUsers.map(u => {
      const badge = u.role === 'owner'
        ? '<span class="uc-badge owner">خاوەن</span>'
        : (u.banned ? '<span class="uc-badge banned">دەرکراو</span>' : '<span class="uc-badge active">چالاک</span>');
      
      const createdDate = u.created_at ? new Date(u.created_at).toLocaleDateString('ckb-IQ') : '';

      return `
        <div class="user-card" data-id="${u.id}">
          <div class="uc-avatar">${initials(u.full_name)}</div>
          <div class="uc-info">
            <div class="uc-name">${escapeText(u.full_name || 'بەکارهێنەر')}</div>
            <div class="uc-sub">${createdDate}</div>
          </div>
          ${badge}
        </div>`;
    }).join('');

    list.querySelectorAll('.user-card').forEach(card => {
      card.addEventListener('click', () => openUser(card.dataset.id));
    });
  }

  // ---------- User detail sheet ----------
  const overlay = $('userSheetOverlay');
  const closeBtn = $('userSheetClose');
  
  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => { 
      if (e.target === overlay) overlay.classList.remove('open'); 
    });
  }

  function openUser(id) {
    const u = allUsers.find(x => x.id === id);
    if (!u) return;
    activeUser = u;

    if ($('udAvatar')) $('udAvatar').textContent = initials(u.full_name);
    if ($('udName')) $('udName').textContent = u.full_name || 'بێ ناو';
    if ($('udRole')) $('udRole').textContent = u.role === 'owner' ? 'خاوەنی ماڵپەڕ' : 'بەکارهێنەر';
    if ($('udStatus')) $('udStatus').textContent = u.banned ? 'دەرکراوە' : 'چالاکە';
    if ($('banReasonInput')) $('banReasonInput').value = u.ban_reason || '';

    const banBtn = $('banToggleBtn');
    if (banBtn) {
      if (u.role === 'owner') {
        banBtn.style.display = 'none';
      } else {
        banBtn.style.display = 'block';
        banBtn.textContent = u.banned ? 'گەڕاندنەوەی هەژمار' : 'دەرکردن لە ماڵپەڕ';
        banBtn.classList.toggle('is-banned', u.banned);
      }
    }

    if (overlay) overlay.classList.add('open');
  }

  const banToggleBtn = $('banToggleBtn');
  if (banToggleBtn) {
    banToggleBtn.addEventListener('click', async () => {
      if (!activeUser) return;
      const willBan = !activeUser.banned;
      const reason = $('banReasonInput') ? $('banReasonInput').value.trim() : '';

      banToggleBtn.disabled = true;
      banToggleBtn.textContent = 'چاوەڕوان بە...';

      const { error } = await supabase
        .from('profiles')
        .update({ banned: willBan, ban_reason: willBan ? (reason || 'پێشێلکردنی یاساکانی ماڵپەڕ') : null })
        .eq('id', activeUser.id);

      banToggleBtn.disabled = false;

      if (error) {
        alert('نەتوانرا دۆخی بەکارهێنەر بگۆڕدرێت.');
        return;
      }
      activeUser.banned = willBan;
      await loadUsers();
      openUser(activeUser.id);
    });
  }

  function escapeText(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // دەستپێکردن
  loadUsers();
});
