// Kurd Technology — loads the homepage cards from the database (site_sections)
// instead of hard-coded HTML, so the owner can manage them from the admin panel
// without ever touching this file or index/services.html again.

// Darkens a #rrggbb color by `percent` (negative = darker), used for the
// "custom color" card style's gradient.
function shadeColor(hex, percent) {
  let [r, g, b] = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16));
  r = Math.max(0, Math.min(255, Math.round(r + (percent / 100) * 255)));
  g = Math.max(0, Math.min(255, Math.round(g + (percent / 100) * 255)));
  b = Math.max(0, Math.min(255, Math.round(b + (percent / 100) * 255)));
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function kurdtechShowToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg || 'ئەم بەشە بەم زووانە دێت 🚀';
  toast.classList.add('show');
  clearTimeout(kurdtechShowToast._t);
  kurdtechShowToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

function kurdtechRenderSectionCard(section) {
  const icons = window.KURDTECH_ICONS || {};
  const iconSvg = icons[section.icon] || icons.star || '';
  const isComingSoon = !section.link || section.link.trim() === '#';

  const tag = document.createElement(isComingSoon ? 'div' : 'a');
  tag.className = `cat-card theme-${section.card_style || 'games'}`;
  if (!isComingSoon) {
    tag.href = section.link;
    if (/^https?:\/\//i.test(section.link)) {
      tag.target = '_blank';
      tag.rel = 'noopener';
    }
  } else {
    tag.style.cursor = 'pointer';
    tag.addEventListener('click', () => kurdtechShowToast());
  }

  // "custom" style has no matching CSS class — build its gradient from
  // the chosen color directly instead.
  if (section.card_style === 'custom' && section.color) {
    tag.classList.remove('theme-custom');
    const c = section.color;
    tag.style.background = `linear-gradient(150deg, ${c}, ${shadeColor(c, -35)})`;
  }

  if (section.image_url) {
    tag.style.backgroundImage =
      `linear-gradient(150deg, rgba(0,0,0,.35), rgba(0,0,0,.55)), url('${section.image_url.replace(/'/g, "%27")}')`;
    tag.style.backgroundSize = 'cover';
    tag.style.backgroundPosition = 'center';
  }

  tag.innerHTML = `
    <div class="cat-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
    </div>
    <h3></h3>
    <p></p>
    <span class="cat-go">بینینە <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5l7 7-7 7M21 12H3"></path></svg></span>
  `;
  tag.querySelector('h3').textContent = section.title || '';
  tag.querySelector('p').textContent = section.description || '';
  return tag;
}

async function kurdtechLoadSections() {
  const grid = document.getElementById('cardsGrid');
  const loading = document.getElementById('cardsLoading');
  if (!grid) return;

  const supabase = window.kurdtechSupabase;
  try {
    const { data, error } = await supabase
      .from('site_sections')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;

    if (loading) loading.remove();

    if (!data || !data.length) {
      grid.innerHTML = '<p class="cards-empty">هیچ بەشێک ئێستا نییە.</p>';
      return;
    }

    data.forEach(section => grid.appendChild(kurdtechRenderSectionCard(section)));
  } catch (err) {
    if (loading) loading.textContent = 'نەتوانرا بەشەکان بار بکرێن.';
    console.error('kurdtechLoadSections failed:', err);
  }
}

window.addEventListener('kurdtech:ready', kurdtechLoadSections);
