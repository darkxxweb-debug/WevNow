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
      return;
    }
    emptyState.style.display = 'none';

    panelList.innerHTML = panels
      .map((p) => {
        const link = `${window.location.origin}/vcf/${p.slug}`;
        return `
      <div class="vcf-card">
        <div class="vcf-card-top">
          <div class="vcf-title">${escapeHtml(p.title)}</div>
          <span class="chip">${p.contacts.length} number${p.contacts.length === 1 ? '' : 's'}</span>
        </div>
        <div class="vcf-meta">${escapeHtml(link)}</div>
        <div class="vcf-actions">
          <button class="btn btn-ghost copyBtn" data-link="${escapeHtml(link)}"><i class="fa-solid fa-copy"></i> Copy link</button>
          <a class="btn btn-teal" href="/api/vcf/${p.slug}/download"><i class="fa-solid fa-download"></i> Download</a>
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
  const title = document.getElementById('panelTitle').value.trim();

  createPanelBtn.disabled = true;
  createPanelBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Creating...';

  try {
    const res = await fetch('/api/vcf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
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
