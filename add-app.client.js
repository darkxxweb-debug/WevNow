const form = document.getElementById('addAppForm');
const submitBtn = document.getElementById('submitBtn');
const statusMsg = document.getElementById('statusMsg');
const loginNotice = document.getElementById('loginNotice');
const previewLinksWrap = document.getElementById('previewLinksWrap');
const addPreviewBtn = document.getElementById('addPreviewBtn');

const MAX_PREVIEWS = 8;

function addPreviewRow() {
  if (previewLinksWrap.children.length >= MAX_PREVIEWS) return;
  const row = document.createElement('div');
  row.className = 'preview-link-row';
  row.innerHTML = `<input type="url" class="preview-link-input" placeholder="https://... preview link">`;
  previewLinksWrap.appendChild(row);
  if (previewLinksWrap.children.length >= MAX_PREVIEWS) {
    addPreviewBtn.style.display = 'none';
  }
}
addPreviewBtn.addEventListener('click', addPreviewRow);
addPreviewRow();

function showStatus(message, type) {
  statusMsg.textContent = message;
  statusMsg.className = `status-msg show ${type}`;
}

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.user) {
      loginNotice.style.display = 'block';
      form.style.display = 'none';
    }
  } catch (err) {
    // silent
  }
}
checkAuth();

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const previewLinks = Array.from(document.querySelectorAll('.preview-link-input'))
    .map((i) => i.value.trim())
    .filter(Boolean)
    .slice(0, MAX_PREVIEWS);

  const payload = {
    name: document.getElementById('name').value.trim(),
    coverPhoto: document.getElementById('coverPhoto').value.trim(),
    previewLinks,
    downloadLink: document.getElementById('downloadLink').value.trim(),
    size: document.getElementById('size').value.trim(),
    category: document.getElementById('category').value,
    ownerNumber: document.getElementById('ownerNumber').value.trim(),
    description: document.getElementById('description').value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Adding...';

  try {
    const res = await fetch('/api/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Could not add this app.');

    showStatus('Added! Redirecting to your apps...', 'info');
    setTimeout(() => (window.location.href = '/apps/mine'), 900);
  } catch (err) {
    showStatus(err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add app';
  }
});
