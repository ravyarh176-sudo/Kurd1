// Kurd Technology — page guard.
// Include this on every page that requires a signed-in, non-banned user
// (services.html, cv-builder.html, admin.html). It:
//   1. Redirects to index.html if nobody is signed in.
//   2. Shows a full-screen "you were removed" message if the account is banned.
//   3. Exposes window.kurdtechUser / window.kurdtechProfile for the page to use
//      (e.g. to show an "Owner" badge or an admin-only link).
// Fires a 'kurdtech:ready' event on window once everything is confirmed OK,
// so the page's own script can safely run.

(function () {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.warn('Supabase config missing — guard.js cannot verify the session.');
    return;
  }
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  window.kurdtechSupabase = supabase;

  // full-screen blocking overlay, shown until we know the user is OK
  const overlay = document.createElement('div');
  overlay.id = 'guardOverlay';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:999; background:#0A0E17;
    display:flex; align-items:center; justify-content:center;
    color:#fff; font-family:'Vazirmatn', sans-serif; font-size:13px;
    flex-direction:column; gap:14px; text-align:center; padding:24px;
  `;
  overlay.innerHTML = `<div id="guardSpinner" style="width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#FDBA12;animation:guardSpin .8s linear infinite;"></div>
    <style>@keyframes guardSpin{to{transform:rotate(360deg)}}</style>`;
  document.documentElement.appendChild(overlay);

  function showBanScreen(reason) {
    overlay.innerHTML = `
      <div style="width:56px;height:56px;border-radius:50%;background:rgba(206,17,38,.15);display:flex;align-items:center;justify-content:center;">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#EF4444" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"></line></svg>
      </div>
      <div style="font-family:'Noto Kufi Arabic', sans-serif; font-weight:700; font-size:16px;">تۆ لەلایەن سەرۆکی وێبسایتەوە دەرکراویت</div>
      ${reason ? `<div style="color:rgba(255,255,255,.65); max-width:320px; line-height:1.8;">هۆکار: ${reason}</div>` : ''}
      <a href="index.html" style="margin-top:6px; background:#FDBA12; color:#241800; font-weight:700; padding:10px 22px; border-radius:10px; text-decoration:none;">گەڕانەوە</a>
    `;
  }

  async function run() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return;
    }

    let { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role, banned, ban_reason')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      // profile row not created yet (trigger delay) — try once more shortly
      await new Promise(r => setTimeout(r, 700));
      const retry = await supabase
        .from('profiles')
        .select('id, full_name, role, banned, ban_reason')
        .eq('id', session.user.id)
        .single();
      profile = retry.data;
    }

    if (profile && profile.banned) {
      await supabase.auth.signOut();
      showBanScreen(profile.ban_reason);
      return;
    }

    window.kurdtechUser = session.user;
    window.kurdtechProfile = profile || { role: 'user', banned: false };
    overlay.remove();
    window.dispatchEvent(new Event('kurdtech:ready'));
  }

  run();
})();
