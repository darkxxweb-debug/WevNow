const form = document.getElementById('addToolForm');
const submitBtn = document.getElementById('submitBtn');
const statusMsg = document.getElementById('statusMsg');

function showStatus(message, type) {
  statusMsg.textContent = message;
  statusMsg.className = `status-msg show ${type}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById('name').value.trim(),
    link: document.getElementById('link').value.trim(),
    size: document.getElementById('size').value.trim(),
    category: document.getElementById('category').value,
    ownerNumber: document.getElementById('ownerNumber').value.trim(),
    description: document.getElementById('description').value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Adding...';

  try {
    const res = await fetch('/api/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Could not add this tool.');

    showStatus('Added! Redirecting to tools...', 'info');
    setTimeout(() => (window.location.href = '/tools'), 900);
  } catch (err) {
    showStatus(err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add tool';
  }
});
