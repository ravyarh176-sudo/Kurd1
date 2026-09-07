// Kurd Technology — games hub: lists games from the database and plays
// the selected one inside a sandboxed iframe.

window.addEventListener('kurdtech:ready', async () => {
  const supabase = window.kurdtechSupabase;
  const grid = document.getElementById('gamesGrid');
  const loading = document.getElementById('gamesLoading');

  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;

    if (loading) loading.remove();

    if (!data || !data.length) {
      grid.innerHTML = '<p class="games-empty">هێشتا هیچ یارییەک زیاد نەکراوە.</p>';
      return;
    }

    data.forEach(game => grid.appendChild(renderGameCard(game)));
  } catch (err) {
    if (loading) loading.textContent = 'نەتوانرا یارییەکان بار بکرێن.';
    console.error('games load failed:', err);
  }
});

function renderGameCard(game) {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.innerHTML = `
    <div class="game-card-image" style="background-image:url('${(game.image_url || '').replace(/'/g, "\\'")}')">
      <span class="game-card-play">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        یاری بکە
      </span>
    </div>
    <div class="game-card-body">
      <div class="game-card-title">${escapeHtml(game.title)}</div>
      ${game.description ? `<div class="game-card-desc">${escapeHtml(game.description)}</div>` : ''}
    </div>
  `;
  card.addEventListener('click', () => openGame(game));
  return card;
}

function openGame(game) {
  const player = document.getElementById('gamePlayer');
  const frame = document.getElementById('gamePlayerFrame');
  const title = document.getElementById('gamePlayerTitle');
  title.textContent = game.title;
  frame.src = game.entry_url;
  player.classList.add('open');
}

document.getElementById('gamePlayerClose').addEventListener('click', () => {
  const player = document.getElementById('gamePlayer');
  const frame = document.getElementById('gamePlayerFrame');
  player.classList.remove('open');
  frame.src = 'about:blank'; // stop the game's audio/loop when closing
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
