// Kurd Technology — connects guard.js's session/profile data to the
// services.html UI (name, owner badge, chat button + panel).
// Kept separate from services.js on purpose so nothing already working is touched.

window.addEventListener('kurdtech:ready', async () => {
  const supabase = window.kurdtechSupabase;
  const profile = window.kurdtechProfile;

  const nameEl = document.getElementById('userNameText');
  if (nameEl && profile && profile.full_name) nameEl.textContent = profile.full_name;

  const userChip = document.getElementById('userChip');
  if (userChip) {
    userChip.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('دەتەوێت چوونەدەرەوە بکەیت؟')) {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
      }
    });
  }

  const isOwner = profile && profile.role === 'owner';
  const ownerBadge = document.getElementById('ownerBadge');
  if (ownerBadge) ownerBadge.hidden = !isOwner;

  // ---------- Chat: find the owner to talk to, wire the panel ----------
  const chatBtn = document.getElementById('chatOpenBtn');
  const chatOverlay = document.getElementById('chatOverlay');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const chatMount = document.getElementById('chatMount');
  if (!chatBtn || isOwner) return; // owner uses the admin dashboard instead

  const { data: ownerRow } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle();

  if (!ownerRow) return; // no owner set up yet

  chatBtn.hidden = false;

  let mounted = false;
  chatBtn.addEventListener('click', () => {
    chatOverlay.classList.add('open');
    if (!mounted) {
      window.KurdChat.mount({
        container: chatMount,
        otherUserId: ownerRow.id,
        otherName: ownerRow.full_name || 'خاوەنی ماڵپەڕ'
      });
      mounted = true;
    }
  });
  chatCloseBtn.addEventListener('click', () => chatOverlay.classList.remove('open'));
  chatOverlay.addEventListener('click', (e) => { if (e.target === chatOverlay) chatOverlay.classList.remove('open'); });

  // unread badge
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', window.kurdtechUser.id)
    .eq('sender_id', ownerRow.id)
    .eq('read', false);
  const dot = document.getElementById('chatDot');
  if (dot && count > 0) dot.hidden = false;
});

// ---------- Real stats: user count, satisfaction, who's online now ----------
window.addEventListener('kurdtech:ready', async () => {
  const supabase = window.kurdtechSupabase;
  const user = window.kurdtechUser;

  const usersEl = document.getElementById('statUsersCount');
  const satEl = document.getElementById('statSatisfaction');
  const onlineEl = document.getElementById('statOnlineCount');
  if (!usersEl && !satEl && !onlineEl) return; // this page has no stats bar

  // total registered users
  if (usersEl) {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    usersEl.textContent = (count || 0).toLocaleString('ar') + '+';
  }

  // real satisfaction, from the ratings_summary view (never individual answers)
  if (satEl) {
    const { data } = await supabase.from('ratings_summary').select('*').maybeSingle();
    satEl.textContent = data && data.total_ratings > 0 ? `%${data.satisfaction_pct}` : '—';
  }

  // who's online right now, via Supabase Realtime Presence
  if (onlineEl) {
    const channel = supabase.channel('kurdtech-online', { config: { presence: { key: user.id } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        const count = Object.keys(channel.presenceState()).length;
        onlineEl.textContent = count;
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
      });
  }

  // ---------- 3-week satisfaction prompt (asked once, ever) ----------
  const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;
  const joined = new Date(user.created_at).getTime();
  if (Date.now() - joined < THREE_WEEKS_MS) return;

  const { data: existingRating } = await supabase
    .from('ratings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existingRating) return; // already rated

  showRatingPrompt(supabase, user.id);
});

function showRatingPrompt(supabase, userId) {
  const overlay = document.createElement('div');
  overlay.className = 'rating-overlay';
  overlay.innerHTML = `
    <div class="rating-card">
      <h3>چۆن هەستت کرد بە Kurd Technology؟</h3>
      <p>نزیکی ٣ هەفتەیە لەگەڵمانیت — تکایە ڕەزامەندیت دیاری بکە</p>
      <div class="rating-stars" id="ratingStars">
        ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="rstar" data-v="${n}">★</button>`).join('')}
      </div>
      <button type="button" class="rating-skip" id="ratingSkip">دواتر بیکەم</button>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));

  function close() {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 250);
  }

  overlay.querySelectorAll('.rstar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const stars = parseInt(btn.dataset.v, 10);
      await supabase.from('ratings').insert({ user_id: userId, stars });
      close();
    });
  });
  document.getElementById('ratingSkip').addEventListener('click', close);
}
