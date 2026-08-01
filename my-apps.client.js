const loginNotice = document.getElementById('loginNotice');
const myAppsList = document.getElementById('myAppsList');
const emptyState = document.getElementById('emptyState');
const editOverlay = document.getElementById('editOverlay');
const editCloseBtn = document.getElementById('editCloseBtn');
const editForm = document.getElementById('editForm');
const editStatus = document.getElementById('editStatus');
const editSubmitBtn = document.getElementById('editSubmitBtn');

let myApps = [];
let editingId = null;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.user) {
      loginNotice.style.display = 'block';
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function loadMyApps() {
  try {
    const res = await fetch('/api/apps/mine');
    if (res.status === 401) return;
    myApps = await res.json();

    if (!myApps.length) {
      emptyState.style.display = 'block';
      myAppsList.innerHTML = '';
      return;
    }
    emptyState.style.display = 'none';

    myAppsList.innerHTML = myApps
      .map((t) => {
        const avg = t.ratingCount ? t.ratingSum / t.ratingCount : 0;
        return `
      <div class="app-row" style="cursor:default;">
        <div class="app-row-main">
          <div class="app-icon">
            ${t.coverPhoto ? `<img src="${escapeHtml(t.coverPhoto)}" alt="${escapeHtml(t.name)}">` : `<i class="fa-solid fa-cube"></i>`}
          </div>
          <div class="app-info">
            <div class="app-name">${escapeHtml(t.name)}</div>
            <div class="app-sub">${escapeHtml(t.category || 'Other')} ${t.size ? `&middot; ${escapeHtml(t.size)}` : ''}</div>
            <div class="app-rating">
              <span class="app-rating-num">${avg ? avg.toFixed(1) + ' \u2605' : 'No ratings'}</span>
              <span class="app-downloads">&middot; ${formatCount(t.downloads || 0)} downloads</span>
            </div>
          </div>
        </div>
        <div class="vcf-actions" style="margin-top:10px;">
          <button class="btn btn-ghost editBtn" data-id="${t._id}"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn btn-ghost delBtn" data-id="${t._id}" style="color:var(--danger);"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
      })
      .join('');

    myAppsList.querySelectorAll('.editBtn').forEach((btn) => {
      btn.addEventListener('click', () => openEdit(btn.dataset.id));
    });

    myAppsList.querySelectorAll('.delBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this app? This cannot be undone.')) return;
        await fetch(`/api/apps/${btn.dataset.id}`, { method: 'DELETE' });
        loadMyApps();
      });
    });
  } catch (err) {
    emptyState.style.display = 'block';
  }
}

function openEdit(id) {
  const t = myApps.find((a) => a._id === id);
  if (!t) return;
  editingId = id;

  document.getElementById('editName').value = t.name || '';
  document.getElementById('editCoverPhoto').value = t.coverPhoto || '';
  document.getElementById('editDownloadLink').value = t.downloadLink || '';
  document.getElementById('editSize').value = t.size || '';
  document.getElementById('editCategory').value = t.category || 'App';
  document.getElementById('editOwnerNumber').value = t.ownerNumber || '';
  document.getElementById('editDescription').value = t.description || '';

  editStatus.className = 'status-msg';
  editOverlay.classList.add('open');
}

function closeEdit() {
  editOverlay.classList.remove('open');
  editingId = null;
}
editCloseBtn.addEventListener('click', closeEdit);
editOverlay.addEventListener('click', (e) => {
  if (e.target === editOverlay) closeEdit();
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!editingId) return;

  const payload = {
    name: document.getElementById('editName').value.trim(),
    coverPhoto: document.getElementById('editCoverPhoto').value.trim(),
    downloadLink: document.getElementById('editDownloadLink').value.trim(),
    size: document.getElementById('editSize').value.trim(),
    category: document.getElementById('editCategory').value,
    ownerNumber: document.getElementById('editOwnerNumber').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
  };

  editSubmitBtn.disabled = true;
  editSubmitBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Saving...';

  try {
    const res = await fetch(`/api/apps/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save your changes.');

    editStatus.textContent = 'Saved!';
    editStatus.className = 'status-msg show info';
    loadMyApps();
    setTimeout(closeEdit, 700);
  } catch (err) {
    editStatus.textContent = err.message;
    editStatus.className = 'status-msg show error';
  } finally {
    editSubmitBtn.disabled = false;
    editSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save changes';
  }
});

(async function init() {
  const ok = await checkAuth();
  if (!ok) return;
  loadMyApps();
})();
