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

  // ---------- کۆدی زیادە ----------
  const SAMPLES = {
    design: { page: 'cv-builder', kind: 'js', name: 'دیزاینی نوێی CV', code:
`// دیزاینی نوێ بۆ CV — id دەبێت لە ١٥١ بەرەوژوور بێت و دووبارە نەبێتەوە
KurdCV.addDesign({
  id: 151,
  shape: 'sidebar',     // classic | sidebar | geometric | overlap | minimal
  hd: 'grad',           // solid | grad | light
  photo: 'round',       // round | soft | sq
  accent: '#E11D48',    // ڕەنگی سەرەکی
  deep: '#4C0519',      // ڕەنگی تۆخ
  font: 'kufi', bg: 'cream', st: 'pill'
});` },
    card: { page: 'services', kind: 'js', name: 'کارتی نوێ', code:
`// کارتێکی نوێ لە پەڕەی خزمەتگوزارییەکان
const grid = document.getElementById('cardsGrid');
if (grid) {
  const a = document.createElement('a');
  a.className = 'cat-card theme-games';
  a.href = 'custom.html?p=offers';
  a.innerHTML = '<h3>پێشکەشەکان</h3><p>بەشێکی نوێ</p>';
  grid.appendChild(a);
}` },
    page: { page: '__new', kind: 'html', name: 'پەڕەی نوێ', code:
`<h2 style="font-family:'Noto Kufi Arabic',sans-serif;margin-bottom:10px;">بەشی نوێ</h2>
<p style="color:rgba(255,255,255,.7);line-height:2;">ئەمە پەڕەیەکی نوێیە. هەر HTMLێک لێرە بنووسە.</p>` },
    css: { page: '*', kind: 'css', name: 'ستایلی نوێ', code:
`/* نموونە: گۆڕینی ڕەنگی دوگمەکان لە هەموو پەڕەکان */
button{ letter-spacing:0; }` }
  };

  let codeRows = [];
  let activeCode = null;
  const KNOWN = ['*', 'index', 'services', 'cv-builder', 'games', 'student'];

  async function loadCode() {
    const box = $('codeList');
    if (!box) return;
    const { data, error } = await supabase.from('site_code').select('*').order('id', { ascending: false });
    if (error) { box.innerHTML = '<div class="loading-hint">نەتوانرا بار بکرێت. site-code.sql ـت ڕەن کردووە؟</div>'; return; }
    codeRows = data || [];
    box.innerHTML = codeRows.map(r => `
      <div class="user-card" data-id="${r.id}">
        <div class="uc-avatar">${r.kind === 'css' ? '🎨' : r.kind === 'html' ? '🧱' : '⚙️'}</div>
        <div class="uc-info">
          <div class="uc-name">${escapeText(r.name)}</div>
          <div class="uc-sub" dir="ltr" style="text-align:right;">${escapeText(r.page)} • ${r.kind}</div>
        </div>
        <span class="uc-badge ${r.enabled ? 'active' : 'banned'}">${r.enabled ? 'چالاک' : 'ناچالاک'}</span>
      </div>`).join('') || '<div class="loading-hint">هێشتا هیچ کۆدێک نییە</div>';
    box.querySelectorAll('.user-card').forEach(c => c.addEventListener('click', () => openCode(parseInt(c.dataset.id, 10))));
  }

  function syncCodeForm() {
    $('scSlugWrap').hidden = $('scPage').value !== '__new';
    $('scTargetWrap').hidden = $('scKind').value !== 'html';
    const link = $('scLink');
    const slug = ($('scSlug').value || '').trim().toLowerCase();
    if ($('scPage').value === '__new' && slug) { link.hidden = false; link.textContent = 'custom.html?p=' + slug; }
    else link.hidden = true;
  }
  ['scPage', 'scKind'].forEach(id => $(id) && $(id).addEventListener('change', syncCodeForm));
  $('scSlug') && $('scSlug').addEventListener('input', syncCodeForm);

  function openCode(id, preset) {
    activeCode = id ? codeRows.find(r => r.id === id) : null;
    const r = activeCode || preset || { name: '', page: '*', kind: 'js', code: '', target: '', enabled: true };
    $('scName').value = r.name || '';
    let page = r.page || '*', slug = '';
    if (page.startsWith('custom-')) { slug = page.slice(7); page = '__new'; }
    else if (page !== '__new' && !KNOWN.includes(page)) page = '*';
    $('scPage').value = page;
    $('scSlug').value = slug;
    $('scKind').value = r.kind || 'js';
    $('scTarget').value = r.target || '';
    $('scCode').value = r.code || '';
    $('scEnabled').checked = r.enabled !== false;
    $('scDelete').hidden = !activeCode;
    syncCodeForm();
    $('codeOverlay').classList.add('open');
  }

  $('codeNewBtn') && $('codeNewBtn').addEventListener('click', () => openCode(null));
  $('codeClose') && $('codeClose').addEventListener('click', () => $('codeOverlay').classList.remove('open'));
  $('codeOverlay') && $('codeOverlay').addEventListener('click', (e) => { if (e.target === $('codeOverlay')) $('codeOverlay').classList.remove('open'); });
  $('scSamples') && $('scSamples').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const s = SAMPLES[b.dataset.s];
    if (s) openCode(activeCode ? activeCode.id : null, Object.assign({ enabled: true, target: '' }, s));
    if (s && activeCode) { // لە دۆخی دەستکاری، تەنها کۆدەکە دەگۆڕێت
      $('scCode').value = s.code;
    }
  });

  $('scSave') && $('scSave').addEventListener('click', async () => {
    let page = $('scPage').value;
    if (page === '__new') {
      const slug = ($('scSlug').value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!slug) { alert('ناوی پەڕەی نوێ بنووسە (تەنها پیتی ئینگلیزی و ژمارە).'); return; }
      page = 'custom-' + slug;
    }
    const row = {
      name: $('scName').value.trim() || 'بێ ناو',
      page, kind: $('scKind').value,
      target: $('scKind').value === 'html' ? ($('scTarget').value.trim() || null) : null,
      code: $('scCode').value,
      enabled: $('scEnabled').checked,
      updated_at: new Date().toISOString()
    };
    const btn = $('scSave'); btn.disabled = true;
    const q = activeCode
      ? supabase.from('site_code').update(row).eq('id', activeCode.id)
      : supabase.from('site_code').insert(row);
    const { error } = await q;
    btn.disabled = false;
    if (error) { alert('نەتوانرا پاشەکەوت بکرێت: ' + error.message); return; }
    $('codeOverlay').classList.remove('open');
    loadCode();
  });

  $('scDelete') && $('scDelete').addEventListener('click', async () => {
    if (!activeCode || !confirm('ئەم کۆدە بسڕدرێتەوە؟')) return;
    const { error } = await supabase.from('site_code').delete().eq('id', activeCode.id);
    if (error) { alert('نەتوانرا بسڕدرێتەوە.'); return; }
    $('codeOverlay').classList.remove('open');
    loadCode();
  });

  // دەستپێکردن
  loadCode();
  loadDevices();
  loadUsers();
  loadCvStats();
  loadLocks();
});
