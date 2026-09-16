// ============================================================
// ADMIN PANEL JS - خوێندنەوەی دروستی بەکارهێنەران و ئامارەکان
// ============================================================

let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  // دڵنیابوون لەوەی سەپابەیس هەیە
  if (typeof supabaseClient === 'undefined' || !supabaseClient) {
    console.error('Supabase client is missing.');
    return;
  }

  // وەرگرتنی دۆخی چوونەژوورەوە
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return;
    }
  } catch (e) {
    console.error(e);
  }

  // بارکردنی بەکارهێنەران
  await fetchAndRenderUsers();

  // بەستنەوەی پۆپ ئەپی بەکارهێنەر
  const closeBtn = document.getElementById('closeSheetBtn');
  const overlay = document.getElementById('userOverlay');
  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }
});

async function fetchAndRenderUsers() {
  const usersListEl = document.getElementById('usersList');
  const kpiTotal = document.getElementById('kpiTotalUsers');
  const kpiAdmins = document.getElementById('kpiAdmins');
  const kpiBanned = document.getElementById('kpiBanned');

  if (usersListEl) {
    usersListEl.innerHTML = '<div class="loading-hint">باردەکرێت...</div>';
  }

  // ۱. هەوڵدان بۆ هێنان بە شێوازی RPC کە تایبەتە بە ئەدمین لە سیستەمەکەتدا
  let usersData = null;
  
  try {
    const { data: rpcData, error: rpcErr } = await supabaseClient.rpc('admin_get_all_users');
    if (!rpcErr && rpcData) {
      usersData = rpcData;
    }
  } catch (e) {
    console.warn('RPC method failed, falling back to direct table query');
  }

  // ۲. ئەگەر RPC نەبوو، ڕاستەوخۆ لە خشتەی profiles دەیهێنین
  if (!usersData) {
    const { data: tableData, error: tableErr } = await supabaseClient
      .from('profiles')
      .select('*');

    if (!tableErr && tableData) {
      usersData = tableData;
    } else {
      console.error('Table error:', tableErr);
    }
  }

  // ئەگەر بەکارهێنەر نەبوو
  if (!usersData || usersData.length === 0) {
    if (usersListEl) {
      usersListEl.innerHTML = '<div class="loading-hint">هیچ بەکارهێنەرێک نەدۆزرایەوە یان دەسەڵاتی بینین نییە</div>';
    }
    if (kpiTotal) kpiTotal.textContent = '0';
    if (kpiAdmins) kpiAdmins.textContent = '0';
    if (kpiBanned) kpiBanned.textContent = '0';
    return;
  }

  allUsers = usersData;

  // ژماردنی ئامارەکان
  const total = allUsers.length;
  let admins = 0;
  let banned = 0;

  allUsers.forEach(u => {
    const r = (u.role || '').toLowerCase();
    if (r === 'admin' || r === 'owner') admins++;
    if (u.is_banned || u.status === 'banned') banned++;
  });

  if (kpiTotal) kpiTotal.textContent = total;
  if (kpiAdmins) kpiAdmins.textContent = admins;
  if (kpiBanned) kpiBanned.textContent = banned;

  // ڕێزکردنی کارتەکان بە دیزاینە ئەسڵییەکە
  if (usersListEl) {
    usersListEl.innerHTML = '';

    allUsers.forEach(user => {
      const name = user.full_name || user.username || user.name || (user.email ? user.email.split('@')[0] : 'بەکارهێنەر');
      const email = user.email || 'بێ ئیمەیڵ';
      const role = (user.role || 'user').toLowerCase();
      const isBanned = user.is_banned || user.status === 'banned';
      const initial = name.trim().charAt(0).toUpperCase() || '؟';

      let badgeClass = 'active';
      let badgeLabel = 'چالاک';

      if (role === 'admin' || role === 'owner') {
        badgeClass = 'owner';
        badgeLabel = 'سەرۆک';
      } else if (isBanned) {
        badgeClass = 'banned';
        badgeLabel = 'بەندکراو';
      }

      const card = document.createElement('div');
      card.className = 'user-card';
      card.innerHTML = `
        <div class="uc-avatar">${initial}</div>
        <div class="uc-info">
          <div class="uc-name">${escapeText(name)}</div>
          <div class="uc-sub">${escapeText(email)}</div>
        </div>
        <span class="uc-badge ${badgeClass}">${badgeLabel}</span>
      `;

      card.addEventListener('click', () => showUserSheet(user));
      usersListEl.appendChild(card);
    });
  }
}

function showUserSheet(user) {
  const overlay = document.getElementById('userOverlay');
  if (!overlay) return;

  const name = user.full_name || user.username || user.name || (user.email ? user.email.split('@')[0] : 'بەکارهێنەر');
  const email = user.email || 'بێ ئیمەیڵ';
  const role = user.role || 'user';
  const isBanned = user.is_banned || user.status === 'banned';

  const avatar = document.getElementById('sheetAvatar');
  const nameEl = document.getElementById('sheetName');
  const emailEl = document.getElementById('sheetEmail');
  const roleEl = document.getElementById('sheetRoleText');
  const statusEl = document.getElementById('sheetStatusText');
  const dateEl = document.getElementById('sheetCreatedAt');
  const banBtn = document.getElementById('sheetBanBtn');

  if (avatar) avatar.textContent = name.trim().charAt(0).toUpperCase() || '؟';
  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;
  if (roleEl) roleEl.textContent = role;
  if (statusEl) statusEl.textContent = isBanned ? 'بەندکراو' : 'چالاک';
  if (dateEl) dateEl.textContent = user.created_at ? new Date(user.created_at).toLocaleDateString('ckb-IQ') : '---';

  if (banBtn) {
    banBtn.textContent = isBanned ? 'لابردنی بەندکردن' : 'بەندکردنی بەکارهێنەر';
    if (isBanned) banBtn.classList.add('is-banned');
    else banBtn.classList.remove('is-banned');

    banBtn.onclick = async () => {
      banBtn.disabled = true;
      banBtn.textContent = 'چاوەڕوان بە...';
      const targetStatus = !isBanned;

      // هەوڵدان لەگەڵ RPC یان Table
      let ok = false;
      try {
        const { error } = await supabaseClient.rpc('admin_toggle_ban', { target_user_id: user.id });
        if (!error) ok = true;
      } catch (e) {}

      if (!ok) {
        const { error } = await supabaseClient
          .from('profiles')
          .update({ is_banned: targetStatus })
          .eq('id', user.id);
        if (!error) ok = true;
      }

      overlay.classList.remove('open');
      await fetchAndRenderUsers();
    };
  }

  overlay.classList.add('open');
}

function escapeText(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
