const loginNotice = document.getElementById('loginNotice');
const createPanelForm = document.getElementById('createPanelForm');
const createPanelBtn = document.getElementById('createPanelBtn');
const createStatus = document.getElementById('createStatus');
const panelList = document.getElementById('panelList');
const emptyState = document.getElementById('emptyState');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.user) {
      loginNotice.style.display = 'block';
      createPanelForm.style.display = 'none';
    }
  } catch (err) {
    // silent
  }
}

async function loadPanels() {
  try {
    const res = await fetch('/api/vcf/mine');
    if (res.status === 401) return;
    const panels = await res.json();

    if (!panels.length) {
      emptyState.style.display = 'block';
      panelList.innerHTML = '';
      return;
    }
    emptyState.style.display = 'none';

    panelList.innerHTML = panels
      .map((p) => {
        const link = `${window.location.origin}/vcf/${p.slug}`;
        const progress = p.targetCount > 0 ? `${p.contacts.length}/${p.targetCount}` : `${p.contacts.length}`;
        return `
      <div class="vcf-card">
        ${p.coverPhoto ? `<img src="${escapeHtml(p.coverPhoto)}" alt="" style="width:100%;border-radius:10px;margin-bottom:10px;max-height:140px;object-fit:cover;">` : ''}
        <div class="vcf-card-top">
          <div class="vcf-title">${escapeHtml(p.title)}</div>
          <span class="chip">${escapeHtml(progress)} number${p.contacts.length === 1 ? '' : 's'}</span>
        </div>
        <div class="vcf-meta">
          ${p.isPublic ? '<i class="fa-solid fa-globe"></i> Public' : '<i class="fa-solid fa-lock"></i> Private'}
          &middot; ${p.downloadEnabled ? '<span style="color:var(--teal);">download unlocked</span>' : 'download locked'}
          ${p.expiresAt ? `&middot; expires ${new Date(p.expiresAt).toLocaleString()}` : ''}
        </div>
        <div class="vcf-meta">${escapeHtml(link)}</div>
        <div class="vcf-actions">
          <button class="btn btn-ghost copyBtn" data-link="${escapeHtml(link)}"><i class="fa-solid fa-copy"></i> Copy link</button>
          ${p.downloadEnabled
            ? `<button class="btn btn-ghost lockBtn" data-slug="${p.slug}"><i class="fa-solid fa-lock"></i> Lock download</button>
               <a class="btn btn-teal" href="/api/vcf/${p.slug}/download"><i class="fa-solid fa-download"></i> Download</a>`
            : `<button class="btn btn-primary pushBtn" data-slug="${p.slug}"><i class="fa-solid fa-unlock"></i> Enable download</button>`
          }
          <button class="btn btn-ghost visBtn" data-slug="${p.slug}" data-public="${p.isPublic}">
            <i class="fa-solid ${p.isPublic ? 'fa-eye-slash' : 'fa-eye'}"></i> ${p.isPublic ? 'Make private' : 'Make public'}
          </button>
          <button class="btn btn-ghost delBtn" data-slug="${p.slug}" style="color:var(--danger);"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
      })
      .join('');

    panelList.querySelectorAll('.copyBtn').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.link).catch(() => {});
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        setTimeout(() => (btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy link'), 1200);
      });
    });

    panelList.querySelectorAll('.pushBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/vcf/${btn.dataset.slug}/push`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          loadPanels();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    panelList.querySelectorAll('.lockBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await fetch(`/api/vcf/${btn.dataset.slug}/lock`, { method: 'POST' });
        loadPanels();
      });
    });

    panelList.querySelectorAll('.visBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const isPublic = btn.dataset.public === 'true';
        await fetch(`/api/vcf/${btn.dataset.slug}/visibility`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: !isPublic }),
        });
        loadPanels();
      });
    });

    panelList.querySelectorAll('.delBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this VCF panel? This cannot be undone.')) return;
        await fetch(`/api/vcf/${btn.dataset.slug}`, { method: 'DELETE' });
        loadPanels();
      });
    });
  } catch (err) {
    emptyState.style.display = 'block';
  }
}

createPanelForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('panelTitle').value.trim(),
    coverPhoto: document.getElementById('panelCover').value.trim(),
    targetCount: document.getElementById('panelTarget').value,
    durationHours: document.getElementById('panelDuration').value,
    isPublic: document.getElementById('panelPublic').checked,
  };

  createPanelBtn.disabled = true;
  createPanelBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Creating...';

  try {
    const res = await fetch('/api/vcf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not create the panel.');

    createStatus.textContent = 'Panel created!';
    createStatus.className = 'status-msg show info';
    createPanelForm.reset();
    loadPanels();
  } catch (err) {
    createStatus.textContent = err.message;
    createStatus.className = 'status-msg show error';
  } finally {
    createPanelBtn.disabled = false;
    createPanelBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Create panel';
  }
});

checkAuth();
loadPanels();
