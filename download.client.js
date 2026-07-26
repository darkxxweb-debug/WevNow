const urlInput = document.getElementById('url');
const downloadBtn = document.getElementById('downloadBtn');
const statusMsg = document.getElementById('statusMsg');
const resultCard = document.getElementById('resultCard');
const resultThumb = document.getElementById('resultThumb');
const resultTitle = document.getElementById('resultTitle');
const audioLink = document.getElementById('audioLink');
const videoLink = document.getElementById('videoLink');

function showStatus(message, type) {
  statusMsg.textContent = message;
  statusMsg.className = `status-msg show ${type}`;
}

function clearStatus() {
  statusMsg.className = 'status-msg';
}

async function handleDownload() {
  const url = urlInput.value.trim();
  if (!url) {
    showStatus('Please paste a YouTube link first.', 'error');
    return;
  }

  clearStatus();
  resultCard.classList.remove('show');
  downloadBtn.disabled = true;
  downloadBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Fetching...';

  try {
    const res = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Could not fetch this link.');

    resultTitle.textContent = data.title;
    resultThumb.src = data.thumbnail || 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png';

    if (data.audio && data.audio.url) {
      audioLink.href = data.audio.url;
      audioLink.style.display = 'inline-flex';
    } else {
      audioLink.style.display = 'none';
    }

    if (data.video && data.video.url) {
      videoLink.href = data.video.url;
      videoLink.style.display = 'inline-flex';
    } else {
      videoLink.style.display = 'none';
    }

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
