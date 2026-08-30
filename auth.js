// Kurd Technology — authentication, powered by Supabase.
//
// Flow this file implements (Google-only, as asked):
//   1. Visitor lands on this page and sees a single "Continue with Google"
//      button. Tapping it opens Google's own account picker.
//   2. Google redirects back here with a session already created.
//   3. If this is their first time (no display name saved yet), we ask
//      "What's your name?" once and save it.
//   4. A short "Welcome" flash plays, then they land on services.html.
//
// Nothing secret lives in this file. SUPABASE_URL and SUPABASE_ANON_KEY
// come from config.js, which Cloudflare Pages generates at deploy time
// from the environment variables set in the Cloudflare dashboard.

(function () {
  const $ = (id) => document.getElementById(id);

  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.warn('Supabase config missing. Auth will not work until config.js is generated (see build.sh).');
  }

  const supabase = window.supabase.createClient(
    window.SUPABASE_URL || '',
    window.SUPABASE_ANON_KEY || ''
  );

  // ---------- Helpers ----------
  function showError(boxId, message) {
    const box = $(boxId);
    box.textContent = message;
    box.hidden = false;
  }
  function clearError(boxId) {
    const box = $(boxId);
    box.hidden = true;
    box.textContent = '';
  }
  function setBusy(btn, busyText) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = busyText;
    btn.disabled = true;
  }
  function friendlyError(err) {
    const msg = (err && err.message) || '';
    if (/popup/i.test(msg)) return 'پەنجەرەکە داخرا، تکایە دووبارە هەوڵ بدەرەوە.';
    return msg || 'شتێک هەڵە بوو، تکایە دووبارە هەوڵ بدەرەوە.';
  }

  function showStep(id) {
    ['stepWelcome', 'stepName', 'stepFlash'].forEach(s => { $(s).hidden = s !== id; });
  }

  // ---------- Step 1: "Continue with Google" ----------
  $('googleBtn').addEventListener('click', async () => {
    clearError('authError');
    const btn = $('googleBtn');
    setBusy(btn, '...چاوەڕوان بە');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/index.html' }
    });
    if (error) {
      showError('authError', friendlyError(error));
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText;
    }
    // on success, the browser navigates away to Google, then back here.
  });

  // ---------- Step 2: pick a display name (first-time visitors only) ----------
  $('nameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('nameError');
    const name = $('displayName').value.trim();
    if (!name) {
      showError('nameError', 'تکایە ناوێک بنووسە.');
      return;
    }
    const btn = $('nameSubmitBtn');
    setBusy(btn, '...چاوەڕوان بە');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', user.id);
      if (error) throw error;
      playWelcomeAndGo(name);
    } catch (err) {
      showError('nameError', friendlyError(err));
      btn.disabled = false;
      btn.innerHTML = 'بەردەوامبوون';
    }
  });

  // ---------- Step 3: brief welcome, then into the app ----------
  function playWelcomeAndGo(name) {
    showStep('stepFlash');
    $('flashText').textContent = 'بەخێربێیت، ' + name;
    setTimeout(() => { window.location.href = 'services.html'; }, 1100);
  }

  // ---------- On load: figure out which step to show ----------
  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showStep('stepWelcome');
      return;
    }

    // Already signed in (fresh Google redirect, or a returning visitor
    // who still has this tab open). Look up their profile.
    let profile = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      profile = data;
    } catch (e) { /* profile row may not exist yet on the very first redirect */ }

    if (profile && profile.full_name) {
      playWelcomeAndGo(profile.full_name);
    } else {
      showStep('stepName');
    }
  }

  init();
})();
