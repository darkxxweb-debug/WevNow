const groupList = document.getElementById('groupList');
const emptyState = document.getElementById('emptyState');
const addGroupForm = document.getElementById('addGroupForm');
const addGroupBtn = document.getElementById('addGroupBtn');
const addGroupStatus = document.getElementById('addGroupStatus');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function loadGroups() {
  try {
    const res = await fetch('/api/whatsapp');
    const groups = await res.json();

    if (!groups.length) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    groupList.innerHTML = groups
      .map(
        (g) => `
      <div class="wa-card">
        <div class="wa-icon"><i class="fa-brands fa-whatsapp"></i></div>
        <div class="wa-info">
          <div class="wa-name">${escapeHtml(g.name)}</div>
          <div class="wa-clicks">${g.clicks} join${g.clicks === 1 ? '' : 's'}</div>
        </div>
        <button class="btn btn-primary joinBtn" data-id="${g._id}" style="width:auto;padding:9px 14px;font-size:0.8rem;">Join</button>
      </div>
    `
      )
      .join('');

    groupList.querySelectorAll('.joinBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/whatsapp/${btn.dataset.id}/click`, { method: 'POST' });
          const data = await res.json();
          if (data.link) window.open(data.link, '_blank', 'noopener');
        } catch (err) {
          // silent
        }
      });
    });
  } catch (err) {
    emptyState.style.display = 'block';
  }
}

addGroupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('groupName').value.trim();
  const link = document.getElementById('groupLink').value.trim();

  addGroupBtn.disabled = true;
  addGroupBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Adding...';

  try {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, link }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not add this group.');

    addGroupStatus.textContent = 'Group added!';
    addGroupStatus.className = 'status-msg show info';
    addGroupForm.reset();
    loadGroups();
  } catch (err) {
    addGroupStatus.textContent = err.message;
    addGroupStatus.className = 'status-msg show error';
  } finally {
    addGroupBtn.disabled = false;
    addGroupBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add group';
  }
});

loadGroups();
