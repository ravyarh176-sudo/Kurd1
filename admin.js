// Kurd Technology — admin dashboard (owner only) + Chat & Voice.

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

  // ---------- تابی چات و بەڕێوەبردن ----------
  function setTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if ($('tabChat')) $('tabChat').hidden = tab !== 'chat';
    if ($('tabManage')) $('tabManage').hidden = tab !== 'manage';
  }

  document.querySelectorAll('.admin-tab').forEach(t => {
    t.addEventListener('click', () => setTab(t.dataset.tab));
  });

  // ---------- پەنجەرەی بەکارهێنەر ----------
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

    setTab('chat');

    // گرێدانی چات و دەنگ
    if (window.KurdChat && typeof window.KurdChat.mount === 'function') {
      window.KurdChat.mount({
        container: $('userChatMount'),
        otherUserId: u.id,
        otherName: u.full_name || 'بەکارهێنەر'
      });
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

  // ---------- ئامارەکانی CV ----------
  async function loadCvStats() {
    const { data, error } = await supabase.from('cv_usage').select('satisfied');
    if (error) { console.error(error); return; }
    const rows = data || [];
    const yes = rows.filter(r => r.satisfied === true).length;
    const no = rows.filter(r => r.satisfied === false).length;
    if ($('statCvTotal')) $('statCvTotal').textContent = rows.length;
    if ($('statCvYes')) $('statCvYes').textContent = yes;
    if ($('statCvNo')) $('statCvNo').textContent = no;
    if ($('statCvPct')) {
      $('statCvPct').textContent = (yes + no) > 0
        ? `ڕێژەی ڕەزامەندی: %${Math.round(yes * 100 / (yes + no))} (لە ${yes + no} وەڵام)`
        : 'هێشتا کەس وەڵامی نەداوەتەوە';
    }
  }

  // ---------- قوفڵکردنی بەشەکان ----------
  async function loadLocks() {
    const box = $('lockList');
    if (!box) return;
    const { data, error } = await supabase
      .from('site_sections')
      .select('id, title, is_locked')
      .order('sort_order', { ascending: true });
    if (error) { box.innerHTML = '<div class="loading-hint">نەتوانرا بەشەکان بار بکرێن</div>'; return; }
    box.innerHTML = (data || []).map(s => `
      <div class="user-card" style="cursor:default;">
        <div class="uc-avatar">${s.is_locked ? '🔒' : '🔓'}</div>
        <div class="uc-info"><div class="uc-name">${escapeText(s.title || 'بێ ناو')}</div>
          <div class="uc-sub">${s.is_locked ? 'قوفڵکراوە' : 'کراوەیە'}</div></div>
        <button type="button" class="lock-toggle" data-id="${s.id}" data-lock="${s.is_locked ? '0' : '1'}"
          style="border:none;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;background:${s.is_locked ? '#4ADE80' : '#FF6B7A'};color:#10151f;">
          ${s.is_locked ? 'کردنەوە' : 'قوفڵکردن'}</button>
      </div>`).join('') || '<div class="loading-hint">هیچ بەشێک نییە</div>';
  }
  const lockBox = $('lockList');
  if (lockBox) lockBox.addEventListener('click', async (e) => {
    const b = e.target.closest('.lock-toggle');
    if (!b) return;
    b.disabled = true;
    const { error } = await supabase.from('site_sections')
      .update({ is_locked: b.dataset.lock === '1' }).eq('id', b.dataset.id);
    if (error) { alert('نەتوانرا بگۆڕدرێت. SQLەکە ڕەن کردووە؟'); b.disabled = false; return; }
    loadLocks();
  });

  // ---------- ئامێرەکان (قوفڵی ئامێر) ----------
  async function loadDevices() {
    const box = $('deviceList');
    if (!box) return;
    const { data, error } = await supabase.rpc('admin_list_devices');
    if (error) { box.innerHTML = '<div class="loading-hint">نەتوانرا ئامێرەکان بار بکرێن. SQLەکە ڕەن کردووە؟</div>'; return; }
    box.innerHTML = (data || []).map(d => `
      <div class="user-card" style="cursor:default;">
        <div class="uc-avatar">${d.blocked ? '⛔' : '📱'}</div>
        <div class="uc-info">
          <div class="uc-name">${escapeText(d.full_name || 'بەکارهێنەر')} — ${escapeText(d.email || '')}</div>
          <div class="uc-sub" dir="ltr" style="text-align:right;">${escapeText(d.model || '')} • ${escapeText(d.ip || '')}<br>${d.last_seen ? new Date(d.last_seen).toLocaleString() : ''}</div>
        </div>
        <button type="button" class="dev-release" data-id="${escapeText(d.device_id)}"
          style="border:none;border-radius:10px;padding:8px 12px;font-weight:700;cursor:pointer;background:#FDBA12;color:#241800;">ئازادکردن</button>
      </div>`).join('') || '<div class="loading-hint">هیچ ئامێرێک تۆمار نەکراوە</div>';
  }
  const devBox = $('deviceList');
  if (devBox) devBox.addEventListener('click', async (e) => {
    const b = e.target.closest('.dev-release');
    if (!b) return;
    if (!confirm('ئەم ئامێرە ئازاد بکرێت؟ دەتوانێت بە ئیمەیڵی تر بچێتە ژوورەوە.')) return;
    b.disabled = true;
    const { error } = await supabase.rpc('admin_release_device', { p_device_id: b.dataset.id });
    if (error) { alert('نەتوانرا ئازاد بکرێت.'); b.disabled = false; return; }
    loadDevices();
  });

  // دەستپێکردن
  loadDevices();
  loadUsers();
  loadCvStats();
  loadLocks();
});
