(function () {
  // ---------- Live clock (Kurdish weekday label, static Kurdish-calendar date) ----------
  const weekdays = ['یەکشەممە','دووشەممە','سێشەممە','چوارشەممە','پێنجشەممە','هەینی','شەممە'];

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now = new Date();
    const clockEl = document.getElementById('clockVal');
    const dateEl = document.getElementById('dateVal');
    if (clockEl) clockEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
    if (dateEl) dateEl.textContent = weekdays[now.getDay()];
  }
  tick();
  setInterval(tick, 30000);

  // ---------- Theme button (visual toggle only, for now) ----------
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-preview');
    });
  }

  // ---------- Toast for "coming soon" cards ----------
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg || 'ئەم بەشە بەم زووانە دێت 🚀';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  document.querySelectorAll('[data-soon]').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      showToast();
    });
  });
})();
