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
      $('userList').innerHTML = `<div class="loading-hint">نەتوانرا بەکارهێنەران بار بکرێن</div>`;
      return;
    }

    allUsers = data || [];
    renderStats();
    renderList();
  }

  function renderStats() {
    $('statTotal').textContent = allUsers.length;
    $('statBanned').textContent = allUsers.filter(u => u.banned).length;
    $('statOwners').textContent = allUsers.filter(u => u.role === 'owner').length;
  }

  function renderList() {
    const list = $('userList');
    if (!allUsers.length) {
      list.innerHTML = `<div class="loading-hint">هیچ بەکارهێنەرێک نییە</div>`;
      return;
    }
    list.innerHTML = allUsers.map(u => {
      const badge = u.role === 'owner'
        ? '<span class="uc-badge owner">خاوەن</span>'
        : (u.banned ? '<span class="uc-badge banned">دەرکراو</span>' : '<span class="uc-badge active">چالاک</span>');
      return `
        <div class="user-card" data-id="${u.id}">
          <div class="uc-avatar">${initials(u.full_name)}</div>
          <div class="uc-info">
            <div class="uc-name">${(u.full_name || 'بێ ناو')}</div>
            <div class="uc-sub">${new Date(u.created_at).toLocaleDateString('ar')}</div>
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
  $('userSheetClose').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

  function openUser(id) {
    const u = allUsers.find(x => x.id === id);
    if (!u) return;
    activeUser = u;

    $('udAvatar').textContent = initials(u.full_name);
    $('udName').textContent = u.full_name || 'بێ ناو';
    $('udRole').textContent = u.role === 'owner' ? 'خاوەنی ماڵپەڕ' : 'بەکارهێنەر';
    $('udStatus').textContent = u.banned ? 'دەرکراوە' : 'چالاکە';
    $('banReasonInput').value = u.ban_reason || '';

    const banBtn = $('banToggleBtn');
    if (u.role === 'owner') {
      banBtn.style.display = 'none';
    } else {
      banBtn.style.display = 'block';
      banBtn.textContent = u.banned ? 'گەڕاندنەوەی هەژمار' : 'دەرکردن لە ماڵپەڕ';
      banBtn.classList.toggle('is-banned', u.banned);
    }

    setTab('chat');

    window.KurdChat.mount({
      container: $('userChatMount'),
      otherUserId: u.id,
      otherName: u.full_name || 'بەکارهێنەر'
    });

    overlay.classList.add('open');
  }

  function setTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    $('tabChat').hidden = tab !== 'chat';
    $('tabManage').hidden = tab !== 'manage';
  }
  document.querySelectorAll('.admin-tab').forEach(t => {
    t.addEventListener('click', () => setTab(t.dataset.tab));
  });

  $('banToggleBtn').addEventListener('click', async () => {
    if (!activeUser) return;
    const willBan = !activeUser.banned;
    const reason = $('banReasonInput').value.trim();

    const { error } = await supabase
      .from('profiles')
      .update({ banned: willBan, ban_reason: willBan ? (reason || 'پێشێلکردنی یاساکانی ماڵپەڕ') : null })
      .eq('id', activeUser.id);

    if (error) {
      alert('نەتوانرا دۆخی بەکارهێنەر بگۆڕدرێت.');
      return;
    }
    activeUser.banned = willBan;
    await loadUsers();
    openUser(activeUser.id);
  });

  loadUsers();
});
