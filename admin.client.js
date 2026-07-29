const lockScreen = document.getElementById('lockScreen');
const adminDashboard = document.getElementById('adminDashboard');
const statGrid = document.getElementById('statGrid');
const adminTabs = document.getElementById('adminTabs');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---------- gate ----------
async function checkAdminSession() {
  try {
    const res = await fetch('/api/admin/session');
    const data = await res.json();
    if (!data.isAdmin) {
      lockScreen.style.display = 'block';
      adminDashboard.style.display = 'none';
      return false;
    }
    lockScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    return true;
  } catch (err) {
    lockScreen.style.display = 'block';
    return false;
  }
}

// ---------- tabs ----------
adminTabs.querySelectorAll('.admin-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    adminTabs.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.admin-panel-section').forEach((s) => s.classList.remove('active'));
    document.getElementById(`section-${tab.dataset.tab}`).classList.add('active');
  });
});

// ---------- stats ----------
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const s = await res.json();
    statGrid.innerHTML = `
      <div class="admin-stat"><div class="admin-stat-num">${s.tools}</div><div class="admin-stat-label">tools</div></div>
      <div class="admin-stat"><div class="admin-stat-num">${s.users}</div><div class="admin-stat-label">users</div></div>
      <div class="admin-stat"><div class="admin-stat-num">${s.groups}</div><div class="admin-stat-label">WhatsApp groups</div></div>
      <div class="admin-stat"><div class="admin-stat-num">${s.visitors}</div><div class="admin-stat-label">page views</div></div>
    `;
  } catch (err) {
    // silent
  }
}

// ---------- tools ----------
async function loadToolsAdmin() {
  const list = document.getElementById('toolsAdminList');
  try {
    const res = await fetch('/api/tools');
    const tools = await res.json();
    if (!tools.length) {
      list.innerHTML = '<div class="empty-state"><div class="glyph"><i class="fa-solid fa-box-open"></i></div><div>No tools yet.</div></div>';
      return;
    }
    list.innerHTML = tools
      .map(
        (t) => `
      <div class="admin-row">
        <div class="admin-row-info">
          <div class="admin-row-title">${escapeHtml(t.name)}</div>
          <div class="admin-row-sub">${escapeHtml(t.category || 'Other')} &middot; by ${escapeHtml(t.ownerUsername || 'unknown')}</div>
        </div>
        <div class="admin-row-actions">
          <button class="icon-btn delToolBtn" data-id="${t._id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `
      )
      .join('');

    list.querySelectorAll('.delToolBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this tool?')) return;
        await fetch(`/api/tools/${btn.dataset.id}`, { method: 'DELETE' });
        loadToolsAdmin();
        loadStats();
      });
    });
  } catch (err) {
    list.innerHTML = '';
  }
}

// ---------- users ----------
async function loadUsersAdmin() {
  const list = document.getElementById('usersAdminList');
  try {
    const res = await fetch('/api/admin/users');
    const users = await res.json();
    if (!users.length) {
      list.innerHTML = '<div class="empty-state"><div class="glyph"><i class="fa-solid fa-users"></i></div><div>No users yet.</div></div>';
      return;
    }
    list.innerHTML = users
      .map(
        (u) => `
      <div class="admin-row">
        <div class="admin-row-info">
          <div class="admin-row-title">${escapeHtml(u.username)}</div>
          <div class="admin-row-sub">code: ${escapeHtml(u.referralCode)} &middot; joined ${timeAgo(u.createdAt)}</div>
        </div>
        <div class="admin-row-actions">
          <button class="icon-btn delUserBtn" data-id="${u._id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `
      )
      .join('');

    list.querySelectorAll('.delUserBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        await fetch(`/api/admin/users/${btn.dataset.id}`, { method: 'DELETE' });
        loadUsersAdmin();
        loadStats();
      });
    });
  } catch (err) {
    list.innerHTML = '';
  }
}

// ---------- announcements ----------
const announcementForm = document.getElementById('announcementForm');
const announcementStatus = document.getElementById('announcementStatus');

async function loadAnnouncementsAdmin() {
  const list = document.getElementById('announcementsAdminList');
  try {
    const res = await fetch('/api/admin/announcements');
    const items = await res.json();
    if (!items.length) {
      list.innerHTML = '<div class="empty-state"><div class="glyph"><i class="fa-solid fa-bullhorn"></i></div><div>No announcements yet.</div></div>';
      return;
    }
    list.innerHTML = items
      .map(
        (a) => `
      <div class="admin-row">
        <div class="admin-row-info">
          <div class="admin-row-title">${escapeHtml(a.message)}</div>
          <div class="admin-row-sub">${a.active ? 'Active now' : 'Inactive'} &middot; ${timeAgo(a.createdAt)}</div>
        </div>
        <div class="admin-row-actions">
          <button class="icon-btn delAnnBtn" data-id="${a._id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `
      )
      .join('');

    list.querySelectorAll('.delAnnBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await fetch(`/api/admin/announcements/${btn.dataset.id}`, { method: 'DELETE' });
        loadAnnouncementsAdmin();
      });
    });
  } catch (err) {
    list.innerHTML = '';
  }
}

announcementForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('announcementMsg').value.trim();
  if (!message) return;
  try {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not post announcement.');
    announcementStatus.textContent = 'Announcement posted!';
    announcementStatus.className = 'status-msg show info';
    announcementForm.reset();
    loadAnnouncementsAdmin();
  } catch (err) {
    announcementStatus.textContent = err.message;
    announcementStatus.className = 'status-msg show error';
  }
});

// ---------- visitors ----------
async function loadVisitorsAdmin() {
  const list = document.getElementById('visitorsAdminList');
  const totalEl = document.getElementById('visitorTotal');
  try {
    const res = await fetch('/api/admin/visitors');
    const data = await res.json();
    totalEl.textContent = data.total;
    list.innerHTML = data.recent
      .map(
        (v) => `
      <div class="admin-row">
        <div class="admin-row-info">
          <div class="admin-row-title">${escapeHtml(v.path || '/')}</div>
          <div class="admin-row-sub">${escapeHtml(v.ip || 'unknown ip')} &middot; ${timeAgo(v.createdAt)}</div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    list.innerHTML = '';
  }
}

// ---------- vcf admin ----------
const vcfAdminForm = document.getElementById('vcfAdminForm');
const vcfAdminStatus = document.getElementById('vcfAdminStatus');

async function loadVcfAdmin() {
  const list = document.getElementById('vcfAdminList');
  try {
    const res = await fetch('/api/admin/vcf');
    const panels = await res.json();
    if (!panels.length) {
      list.innerHTML = '<div class="empty-state"><div class="glyph"><i class="fa-solid fa-address-book"></i></div><div>No admin VCF panels yet.</div></div>';
      return;
    }
    list.innerHTML = panels
      .map((p) => {
        const link = `${window.location.origin}/vcf/${p.slug}`;
        const progress = p.targetCount > 0 ? `${p.contacts.length}/${p.targetCount}` : `${p.contacts.length}`;
        return `
      <div class="vcf-card">
        <div class="vcf-card-top">
          <div class="vcf-title">${escapeHtml(p.title)}</div>
          <span class="chip">${escapeHtml(progress)}</span>
        </div>
        <div class="vcf-meta">
          ${p.isPublic ? '<i class="fa-solid fa-globe"></i> Public' : '<i class="fa-solid fa-lock"></i> Private'}
          &middot; ${p.pushed ? '<span style="color:var(--teal);">pushed</span>' : 'not pushed'}
          &middot; ${escapeHtml(link)}
        </div>
        <div class="vcf-actions">
          <button class="btn btn-ghost pushBtn" data-slug="${p.slug}"><i class="fa-solid fa-paper-plane"></i> Push</button>
          <button class="btn btn-ghost visBtn" data-slug="${p.slug}" data-public="${p.isPublic}">
            <i class="fa-solid ${p.isPublic ? 'fa-eye-slash' : 'fa-eye'}"></i> ${p.isPublic ? 'Make private' : 'Make public'}
          </button>
          <a class="btn btn-teal" href="/api/vcf/${p.slug}/download"><i class="fa-solid fa-download"></i> Download</a>
          <button class="btn btn-ghost delVcfBtn" data-slug="${p.slug}" style="color:var(--danger);"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
      })
      .join('');

    list.querySelectorAll('.pushBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/admin/vcf/${btn.dataset.slug}/push`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          loadVcfAdmin();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    list.querySelectorAll('.visBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const isPublic = btn.dataset.public === 'true';
        await fetch(`/api/admin/vcf/${btn.dataset.slug}/visibility`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: !isPublic }),
        });
        loadVcfAdmin();
      });
    });

    list.querySelectorAll('.delVcfBtn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this VCF panel?')) return;
        await fetch(`/api/vcf/${btn.dataset.slug}`, { method: 'DELETE' });
        loadVcfAdmin();
        loadStats();
      });
    });
  } catch (err) {
    list.innerHTML = '';
  }
}

vcfAdminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('vcfTitle').value.trim(),
    targetCount: document.getElementById('vcfTarget').value,
    durationHours: document.getElementById('vcfDuration').value,
    isPublic: document.getElementById('vcfPublic').checked,
  };
  try {
    const res = await fetch('/api/admin/vcf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not create panel.');
    vcfAdminStatus.textContent = 'VCF panel created!';
    vcfAdminStatus.className = 'status-msg show info';
    vcfAdminForm.reset();
    loadVcfAdmin();
    loadStats();
  } catch (err) {
    vcfAdminStatus.textContent = err.message;
    vcfAdminStatus.className = 'status-msg show error';
  }
});

// ---------- boot ----------
(async function init() {
  const ok = await checkAdminSession();
  if (!ok) return;
  loadStats();
  loadToolsAdmin();
  loadUsersAdmin();
  loadAnnouncementsAdmin();
  loadVisitorsAdmin();
  loadVcfAdmin();
})();
