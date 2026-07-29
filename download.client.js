const urlInput = document.getElementById('url');
const downloadBtn = document.getElementById('downloadBtn');
const statusMsg = document.getElementById('statusMsg');
const resultCard = document.getElementById('resultCard');
const resultThumb = document.getElementById('resultThumb');
const resultTitle = document.getElementById('resultTitle');
const audioLink = document.getElementById('audioLink');
const videoLink = document.getElementById('videoLink');
const mediaGrid = document.getElementById('mediaGrid');
const previewWrap = document.getElementById('previewWrap');
const platformTabs = document.getElementById('platformTabs');

let platform = 'youtube';

const PLATFORM_CONFIG = {
  youtube: { placeholder: 'https://www.youtube.com/watch?v=...', endpoint: '/api/download' },
  tiktok: { placeholder: 'https://www.tiktok.com/@user/video/...', endpoint: '/api/download/tiktok' },
  ig: { placeholder: 'https://www.instagram.com/reel/...', endpoint: '/api/download/ig' },
  fb: { placeholder: 'https://www.facebook.com/.../videos/...', endpoint: '/api/download/fb' },
};

platformTabs.querySelectorAll('.platform-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    platformTabs.querySelectorAll('.platform-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    platform = tab.dataset.platform;
    urlInput.placeholder = PLATFORM_CONFIG[platform].placeholder;
    resultCard.classList.remove('show');
    clearStatus();
  });
});

function showStatus(message, type) {
  statusMsg.textContent = message;
  statusMsg.className = `status-msg show ${type}`;
}

function clearStatus() {
  statusMsg.className = 'status-msg';
}

function resetResult() {
  audioLink.style.display = 'none';
  videoLink.style.display = 'none';
  audioLink.innerHTML = '<i class="fa-solid fa-music"></i> Audio';
  videoLink.innerHTML = '<i class="fa-solid fa-video"></i> Video';
  mediaGrid.innerHTML = '';
  previewWrap.innerHTML = '';
}

// Builds a proxy URL so previews load reliably and downloads actually save
// the file instead of just opening it in the browser.
function proxied(mediaUrl, filename) {
  return `/api/download/proxy?url=${encodeURIComponent(mediaUrl)}&name=${encodeURIComponent(filename)}`;
}

function safeName(title, ext) {
  const clean = (title || 'wavehub-media').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 50) || 'wavehub-media';
  return `${clean}.${ext}`;
}

function addVideoPreview(src) {
  previewWrap.innerHTML = `<video class="preview-media" controls playsinline preload="metadata" src="${src}"></video>`;
}

function addImagePreview(src) {
  previewWrap.innerHTML = `<img class="preview-media" src="${src}" alt="Preview">`;
}

async function handleYoutube(url) {
  const res = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch this link.');

  resultTitle.textContent = data.title;
  resultThumb.src = data.thumbnail || 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png';

  if (data.video && data.video.url) {
    const dl = proxied(data.video.url, safeName(data.title, 'mp4'));
    addVideoPreview(dl);
    videoLink.href = dl;
    videoLink.setAttribute('download', '');
    videoLink.style.display = 'inline-flex';
  }
  if (data.audio && data.audio.url) {
    const dl = proxied(data.audio.url, safeName(data.title, 'mp3'));
    audioLink.href = dl;
    audioLink.setAttribute('download', '');
    audioLink.style.display = 'inline-flex';
  }
}

async function handleTiktok(url) {
  const res = await fetch(`/api/download/tiktok?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch this link.');

  resultTitle.textContent = data.title;
  resultThumb.src = data.thumbnail || 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png';

  if (data.video) {
    const dl = proxied(data.video, safeName(data.title, 'mp4'));
    addVideoPreview(dl);
    videoLink.href = dl;
    videoLink.setAttribute('download', '');
    videoLink.style.display = 'inline-flex';
  }
  if (data.audio) {
    const dl = proxied(data.audio, safeName(data.title, 'mp3'));
    audioLink.href = dl;
    audioLink.setAttribute('download', '');
    audioLink.innerHTML = '<i class="fa-solid fa-music"></i> Audio only';
    audioLink.style.display = 'inline-flex';
  }
}

async function handleFb(url) {
  const res = await fetch(`/api/download/fb?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch this link.');

  resultTitle.textContent = data.title || 'Facebook video';
  resultThumb.src = data.thumbnail || 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png';

  const previewSrc = data.hd || data.sd;
  if (previewSrc) addVideoPreview(proxied(previewSrc, safeName(data.title, 'mp4')));

  if (data.hd) {
    const dl = proxied(data.hd, safeName(data.title, 'mp4'));
    videoLink.href = dl;
    videoLink.setAttribute('download', '');
    videoLink.innerHTML = '<i class="fa-solid fa-video"></i> HD';
    videoLink.style.display = 'inline-flex';
  }
  if (data.sd) {
    const dl = proxied(data.sd, safeName(data.title, 'mp4'));
    audioLink.href = dl;
    audioLink.setAttribute('download', '');
    audioLink.innerHTML = '<i class="fa-solid fa-video"></i> SD';
    audioLink.style.display = 'inline-flex';
  }
}

async function handleIg(url) {
  const res = await fetch(`/api/download/ig?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch this link.');

  resultTitle.textContent = `Instagram media (${data.medias.length})`;
  resultThumb.src = data.medias[0].thumbnail || 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png';

  const first = data.medias[0];
  if (first.type === 'image') addImagePreview(proxied(first.url, safeName('instagram', 'jpg')));
  else addVideoPreview(proxied(first.url, safeName('instagram', 'mp4')));

  mediaGrid.innerHTML = data.medias
    .map((m, i) => {
      const ext = m.type === 'image' ? 'jpg' : 'mp4';
      const dl = proxied(m.url, safeName(`instagram-${i + 1}`, ext));
      return `<a class="btn btn-ghost" href="${dl}" download>
        <i class="fa-solid ${m.type === 'image' ? 'fa-image' : 'fa-video'}"></i> ${m.type === 'image' ? 'Photo' : 'Video'} ${i + 1}
      </a>`;
    })
    .join('');
}

async function handleDownload() {
  const url = urlInput.value.trim();
  if (!url) {
    showStatus('Please paste a link first.', 'error');
    return;
  }

  clearStatus();
  resetResult();
  resultCard.classList.remove('show');
  downloadBtn.disabled = true;
  downloadBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Fetching...';

  try {
    if (platform === 'youtube') await handleYoutube(url);
    else if (platform === 'tiktok') await handleTiktok(url);
    else if (platform === 'ig') await handleIg(url);
    else if (platform === 'fb') await handleFb(url);

    resultCard.classList.add('show');
  } catch (err) {
    showStatus(err.message, 'error');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Get download links';
  }
}

downloadBtn.addEventListener('click', handleDownload);
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleDownload();
});
