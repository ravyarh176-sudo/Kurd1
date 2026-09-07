// Kurd Technology — reusable "upload + drag/zoom crop" photo editor.
// Used by both admin-sections.js and admin-games.js so the canvas/crop
// logic only has to be written once.
//
// Usage:
//   const photo = createPhotoCropEditor({
//     frameId: 'sectionPhotoFrame', canvasId: 'sectionPhotoCanvas',
//     placeholderId: 'sectionPhotoPlaceholder', removeBtnId: 'sectionPhotoRemove',
//     fileInputId: 'sfImageFile', zoomSliderId: 'sfImageZoom', urlInputId: 'sfImage'
//   });

function createPhotoCropEditor(cfg) {
  const $ = (id) => document.getElementById(id);
  const frame = $(cfg.frameId);
  const canvas = $(cfg.canvasId);
  const placeholder = $(cfg.placeholderId);
  const removeBtn = $(cfg.removeBtnId);
  const fileInput = $(cfg.fileInputId);
  const zoomSlider = $(cfg.zoomSliderId);
  const urlInput = $(cfg.urlInputId);
  if (!frame || !canvas) return null;

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let img = null;
  let baseScale = 1, userZoom = 1, offX = 0, offY = 0;
  let dragging = false, startX = 0, startY = 0, startOffX = 0, startOffY = 0;
  let hasEdit = false;

  function clampOffsets() {
    const scale = baseScale * userZoom;
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    offX = Math.max(Math.min(0, W - dw), Math.min(0, offX));
    offY = Math.max(Math.min(0, H - dh), Math.min(0, offY));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!img) return;
    const scale = baseScale * userZoom;
    ctx.drawImage(img, offX, offY, img.naturalWidth * scale, img.naturalHeight * scale);
  }
  function loadImage(image) {
    img = image;
    baseScale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    userZoom = 1;
    offX = (W - img.naturalWidth * baseScale) / 2;
    offY = (H - img.naturalHeight * baseScale) / 2;
    zoomSlider.value = 1;
    zoomSlider.disabled = false;
    placeholder.classList.add('hidden');
    removeBtn.classList.add('show');
    draw();
  }
  function loadFromFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => { hasEdit = true; loadImage(image); };
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  function loadFromUrl(url) {
    if (!url) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => loadImage(image);
    image.onerror = () => {}; // blocked by CORS or missing — just skip the preview
    image.src = url;
  }
  function reset() {
    img = null; hasEdit = false;
    ctx.clearRect(0, 0, W, H);
    placeholder.classList.remove('hidden');
    removeBtn.classList.remove('show');
    zoomSlider.value = 1;
    zoomSlider.disabled = true;
    if (urlInput) urlInput.value = '';
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) loadFromFile(e.target.files[0]);
  });
  zoomSlider.addEventListener('input', () => {
    if (!img) return;
    userZoom = parseFloat(zoomSlider.value);
    clampOffsets(); draw();
  });
  removeBtn.addEventListener('click', reset);

  function pointerDown(e) {
    if (!img) return;
    dragging = true;
    const p = 'touches' in e ? e.touches[0] : e;
    startX = p.clientX; startY = p.clientY; startOffX = offX; startOffY = offY;
  }
  function pointerMove(e) {
    if (!dragging || !img) return;
    const p = 'touches' in e ? e.touches[0] : e;
    offX = startOffX + (p.clientX - startX);
    offY = startOffY + (p.clientY - startY);
    hasEdit = true;
    clampOffsets(); draw();
    e.preventDefault();
  }
  function pointerUp() { dragging = false; }
  frame.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointermove', pointerMove, { passive: false });
  window.addEventListener('pointerup', pointerUp);

  return {
    reset,
    loadFromUrl,
    hasImage: () => !!img,
    wasEdited: () => hasEdit,
    toBlob: () => new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88))
  };
}
