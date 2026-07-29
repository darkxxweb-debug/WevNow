const urlInput = document.getElementById('url');
const urlLabel = document.getElementById('urlLabel');
const downloadBtn = document.getElementById('downloadBtn');
const statusMsg = document.getElementById('statusMsg');
const resultCard = document.getElementById('resultCard');
const resultThumb = document.getElementById('resultThumb');
const resultTitle = document.getElementById('resultTitle');
const audioLink = document.getElementById('audioLink');
const videoLink = document.getElementById('videoLink');
const mediaGrid = document.getElementById('mediaGrid');
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
  mediaGrid.innerHTML = '';
}

async function handleYoutube(url) {
  const res = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch this link.');

  resultTitle.textContent = data.title;
  resultThumb.src = data.thumbnail || 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png';

  if (data.audio && data.audio.url) {
    audioLink.href = data.audio.url;
    audioLink.style.display = 'inline-flex';
  }
  if (data.video && data.video.url) {
    videoLink.href = data.video.url;
    videoLink.style.display = 'inline-flex';
  }
}

async function handleTiktok(url) {
  const res = await fetch(`/api/download/tiktok?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch this link.');

  resultTitle.textContent = data.title;
  resultThumb.src = data.thumbnail || 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png';

  if (data.video) {
    videoLink.href = data.video;
    videoLink.style.display = 'inline-flex';
  }
  if (data.audio) {
    audioLink.href = data.audio;
    audioLink.style.display = 'inline-flex';
  }
}

async function handleFb(url) {
  const res = await fetch(`/api/download/fb?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch this link.');

  resultTitle.textContent = data.title || 'Facebook video';
  resultThumb.src = data.thumbnail || 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png';

  if (data.hd) {
    videoLink.href = data.hd;
    videoLink.textContent = '';
    videoLink.innerHTML = '<i class="fa-solid fa-video"></i> HD';
    videoLink.style.display = 'inline-flex';
  }
  if (data.sd) {
    audioLink.href = data.sd;
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

  mediaGrid.innerHTML = data.medias
    .map(
      (m, i) => `<a class="btn btn-ghost" href="${m.url}" target="_blank" rel="noopener">
        <i class="fa-solid ${m.type === 'image' ? 'fa-image' : 'fa-video'}"></i> ${m.type === 'image' ? 'Photo' : 'Video'} ${i + 1}
      </a>`
    )
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
