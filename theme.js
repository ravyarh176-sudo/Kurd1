// Kurd Technology — dark/light theme toggle.
// Works standalone (no Supabase dependency) so it can be included on any page.

(function () {
  const STORAGE_KEY = 'kurdtech-theme';

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Apply saved preference immediately (before paint where possible)
  let saved = 'dark';
  try { saved = localStorage.getItem(STORAGE_KEY) || 'dark'; } catch (e) {}
  apply(saved);

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
  });
})();
