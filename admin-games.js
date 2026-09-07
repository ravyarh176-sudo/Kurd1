// Kurd Technology — admin panel: "یارییەکان" (manage uploaded games).
// Games are uploaded as a .zip; we extract it client-side with JSZip and
// upload every file into the public "games" Storage bucket, then point
// the game's entry_url at its index.html.

window.addEventListener('kurdtech:ready', async () => {
  const supabase = window.kurdtechSupabase;
  const myProfile = window.kurdtechProfile;
  if (!myProfile || myProfile.role !== 'owner') return;

  const $ = (id) => document.getElementById(id);

  let games = [];
  let editingId = null;
  let pendingZip = null;      // { files: Map<path, Blob>, entryPath: string } — parsed, not yet uploaded
  let loadedOnce = false;

  window.addEventListener('kurdtech:games-tab-open', () => {
    if (!loadedOnce) { loadedOnce = true; loadGames(); }
  });

  async function loadGames() {
    $('gamesList').innerHTML = '<div class="loading-hint">بارکردن...</div>';
    const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: false });
    if (error) {
      $('gamesList').innerHTML = '<div class="loading-hint">نەتوانرا یارییەکان بار بکرێن</div>';
      return;
    }
    games = data || [];
    renderList();
  }

  function renderList() {
    const list = $('gamesList');
    if (!games.length) {
      list.innerHTML = '<div class="loading-hint">هیچ یارییەک زیاد نەکراوە</div>';
      return;
    }
    list.innerHTML = '';
    games.forEach(g => {
      const row = document.createElement('div');
      row.className = 'section-row';
      row.innerHTML = `
        <div class="section-row-icon" style="background:${g.image_url ? `url('${g.image_url.replace(/'/g, "\\'")}') center/cover` : '#333'}">
          ${g.image_url ? '' : '🎮'}
        </div>
        <div class="section-row-info">
          <div class="section-row-title">${escapeHtml(g.title)}</div>
          <div class="section-row-sub">${g.is_visible ? 'پیشاندراو' : 'شاراوە'}</div>
        </div>
        <button type="button" class="section-row-edit" data-act="edit">دەستکاری</button>
        <button type="button" class="section-row-del" data-act="delete">🗑️</button>
      `;
      row.querySelector('[data-act="edit"]').addEventListener('click', () => openForm(g));
      row.querySelector('[data-act="delete"]').addEventListener('click', () => confirmDelete(g));
      list.appendChild(row);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ---------------- Cover image editor (shared component) ----------------
  const photo = createPhotoCropEditor({
    frameId: 'gamePhotoFrame', canvasId: 'gamePhotoCanvas',
    placeholderId: 'gamePhotoPlaceholder', removeBtnId: 'gamePhotoRemove',
    fileInputId: 'gfImageFile', zoomSliderId: 'gfImageZoom', urlInputId: 'gfImage'
  });

  async function uploadGameCover() {
    const blob = await photo.toBlob();
    const fileName = `game-cover-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('section-images').upload(fileName, blob, {
      contentType: 'image/jpeg', upsert: false
    });
    if (error) throw error;
    return supabase.storage.from('section-images').getPublicUrl(fileName).data.publicUrl;
  }

  // ---------------- ZIP handling ----------------
  $('gfZipFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    $('gfZipLabel').textContent = '...هەڵسەنگاندنی فایل';
    try {
      const zip = await JSZip.loadAsync(file);
      const paths = Object.keys(zip.files).filter(p => !zip.files[p].dir);
      // find the entry html: prefer a root-level index.html, else the
      // shallowest index.html anywhere in the archive.
      const htmlCandidates = paths.filter(p => /(^|\/)index\.html$/i.test(p));
      if (!htmlCandidates.length) {
        alert('ئەم فایلە ZIPـە هیچ index.html ـی تێدا نییە.');
        $('gfZipLabel').textContent = 'فایلی ZIPی یاری هەڵبژێرە';
        return;
      }
      htmlCandidates.sort((a, b) => a.split('/').length - b.split('/').length);
      const entryPath = htmlCandidates[0];

      const files = new Map();
      for (const p of paths) {
        const blob = await zip.files[p].async('blob');
        files.set(p, blob);
      }
      pendingZip = { files, entryPath, fileCount: paths.length };
      $('gfZipLabel').textContent = `✓ ${file.name} (${paths.length} فایل ئامادەیە)`;
    } catch (err) {
      alert('نەتوانرا فایلی ZIP بخوێنرێتەوە.');
      $('gfZipLabel').textContent = 'فایلی ZIPی یاری هەڵبژێرە';
      console.error(err);
    }
  });

  async function uploadPendingZip(gameId) {
    const folder = `games/${gameId}`;
    const total = pendingZip.files.size;
    let done = 0;
    const progress = $('gameUploadProgress');
    progress.hidden = false;

    for (const [path, blob] of pendingZip.files) {
      const contentType = guessContentType(path);
      const { error } = await supabase.storage
        .from('games')
        .upload(`${folder}/${path}`, blob, { contentType, upsert: true });
      if (error) throw error;
      done++;
      progress.textContent = `...بارکردنی فایلەکان (${done}/${total})`;
    }
    progress.hidden = true;

    const { data } = supabase.storage.from('games').getPublicUrl(`${folder}/${pendingZip.entryPath}`);
    return { entryUrl: data.publicUrl, folderPath: folder };
  }

  function guessContentType(path) {
    const ext = path.split('.').pop().toLowerCase();
    const map = {
      html: 'text/html', htm: 'text/html', js: 'application/javascript',
      css: 'text/css', json: 'application/json', png: 'image/png',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml',
      webp: 'image/webp', mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav',
      woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf'
    };
    return map[ext] || 'application/octet-stream';
  }

  // ---------------- Add / edit form ----------------
  function openForm(game) {
    editingId = game ? game.id : null;
    $('gameFormTitle').textContent = game ? 'دەستکاریکردنی یاری' : 'یاری نوێ زیاد بکە';
    $('gfTitle').value = game ? game.title : '';
    $('gfDescription').value = game ? (game.description || '') : '';
    $('gfVisible').checked = game ? !!game.is_visible : true;
    $('gfZipFile').value = '';
    $('gfZipLabel').textContent = game ? 'فایلی نوێی ZIP هەڵبژێرە (ئارەزوومەندانە)' : 'فایلی ZIPی یاری هەڵبژێرە';
    pendingZip = null;
    if (photo) {
      photo.reset();
      if (game && game.image_url) photo.loadFromUrl(game.image_url);
    }
    $('gfImage').value = game ? (game.image_url || '') : '';
    $('gameFormOverlay').classList.add('open');
  }
  function closeForm() { $('gameFormOverlay').classList.remove('open'); }

  $('addGameBtn').addEventListener('click', () => openForm(null));
  $('gameFormClose').addEventListener('click', closeForm);
  $('gameFormOverlay').addEventListener('click', (e) => { if (e.target.id === 'gameFormOverlay') closeForm(); });

  $('gameSaveBtn').addEventListener('click', async () => {
    const title = $('gfTitle').value.trim();
    if (!title) { alert('تکایە ناوی یارییەکە بنووسە.'); return; }
    if (!editingId && !pendingZip) { alert('تکایە فایلی ZIPی یارییەکە هەڵبژێرە.'); return; }

    const btn = $('gameSaveBtn');
    btn.disabled = true;
    btn.textContent = '...چاوەڕوان بە';

    try {
      let imageUrl = $('gfImage').value.trim();
      if (photo && photo.hasImage() && photo.wasEdited()) {
        imageUrl = await uploadGameCover();
      }

      const payload = {
        title,
        description: $('gfDescription').value.trim(),
        image_url: imageUrl,
        is_visible: $('gfVisible').checked
      };

      if (editingId) {
        if (pendingZip) {
          const { entryUrl, folderPath } = await uploadPendingZip(editingId);
          payload.entry_url = entryUrl;
          payload.folder_path = folderPath;
        }
        const { error } = await supabase.from('games').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        payload.created_by = window.kurdtechUser.id;
        const { data: inserted, error } = await supabase.from('games')
          .insert({ ...payload, entry_url: 'about:blank' })
          .select().single();
        if (error) throw error;

        const { entryUrl, folderPath } = await uploadPendingZip(inserted.id);
        const { error: updateErr } = await supabase.from('games')
          .update({ entry_url: entryUrl, folder_path: folderPath })
          .eq('id', inserted.id);
        if (updateErr) throw updateErr;
      }

      closeForm();
      await loadGames();
    } catch (err) {
      alert('هەڵەیەک ڕوویدا: ' + (err.message || ''));
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = 'پاشەکەوتکردن';
    }
  });

  // ---------------- Delete ----------------
  function confirmDelete(game) {
    $('confirmMessage').textContent = `دڵنیایت دەتەوێت یارییەکەی "${game.title}" بسڕیتەوە؟`;
    $('confirmOverlay').classList.add('open');
    const yesBtn = $('confirmYesBtn'), noBtn = $('confirmNoBtn');
    const cleanup = () => {
      $('confirmOverlay').classList.remove('open');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
    };
    const onYes = async () => {
      try {
        if (game.folder_path) {
          const { data: files } = await supabase.storage.from('games').list(game.folder_path, { limit: 1000 });
          if (files && files.length) {
            await supabase.storage.from('games').remove(files.map(f => `${game.folder_path}/${f.name}`));
          }
        }
        await supabase.from('games').delete().eq('id', game.id);
      } catch (err) { console.error('delete failed:', err); }
      cleanup();
      loadGames();
    };
    const onNo = () => cleanup();
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  }
});
