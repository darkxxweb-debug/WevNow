const toolList = document.getElementById('toolList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryRow = document.getElementById('categoryRow');
const storeTabs = document.getElementById('storeTabs');
const appDetailOverlay = document.getElementById('appDetailOverlay');
const appDetailPanel = document.getElementById('appDetailPanel');
const appDetailBody = document.getElementById('appDetailBody');
const appDetailClose = document.getElementById('appDetailClose');

let allTools = [];
let activeCategory = 'All';
let mode = 'new';
let currentUser = null;

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

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function starsHtml(avg, size) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(avg);
    html += `<i class="fa-${filled ? 'solid' : 'regular'} fa-star" style="color:${filled ? 'var(--accent)' : 'var(--text-muted)'};${size ? `font-size:${size};` : ''}"></i>`;
  }
  return html;
}

async function loadCurrentUser() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    currentUser = data.user || null;
  } catch (err) {
    currentUser = null;
  }
}

storeTabs.querySelectorAll('.store-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    storeTabs.querySelectorAll('.store-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    mode = tab.dataset.mode;
    loadTools();
  });
});

function renderCategories() {
  const cats = ['All', ...new Set(allTools.map((t) => t.category || 'Other'))];
  categoryRow.innerHTML = cats
    .map(
      (c) =>
        `<span class="chip ${c === activeCategory ? 'active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</span>`
    )
    .join('');

  categoryRow.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.cat;
      render();
    });
  });
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = allTools.filter((t) => {
    const matchesCat = activeCategory === 'All' || t.category === activeCategory;
    const matchesQ = !q || t.name.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  renderCategories();

  if (!filtered.length) {
    toolList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  toolList.innerHTML = filtered.map((t) => appRowHtml(t)).join('');

  toolList.querySelectorAll('.app-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.install-btn')) return;
      openAppDetail(row.dataset.id);
    });
  });

  toolList.querySelectorAll('.install-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await recordDownload(btn.dataset.id, btn.dataset.link);
    });
  });
}

async function recordDownload(id, link) {
  try {
    await fetch(`/api/apps/${id}/download`, { method: 'POST' });
  } catch (err) {
    // silent - still let the download proceed
  }
  window.open(link, '_blank', 'noopener');
  const tool = allTools.find((t) => t._id === id);
  if (tool) tool.downloads = (tool.downloads || 0) + 1;
}

function appRowHtml(t) {
  const avg = t.ratingCount ? t.ratingSum / t.ratingCount : 0;
  return `
    <div class="app-row" data-id="${t._id}">
      <div class="app-row-main">
        <div class="app-icon">
          ${t.coverPhoto ? `<img src="${escapeHtml(t.coverPhoto)}" alt="${escapeHtml(t.name)}">` : `<i class="fa-solid fa-cube"></i>`}
        </div>
        <div class="app-info">
          <div class="app-name">${escapeHtml(t.name)}</div>
          <div class="app-sub">${escapeHtml(t.category || 'Other')} ${t.size ? `&middot; ${escapeHtml(t.size)}` : ''}</div>
          <div class="app-rating">
            <span class="app-stars">${starsHtml(avg)}</span>
            <span class="app-rating-num">${avg ? avg.toFixed(1) : 'New'}</span>
            <span class="app-downloads">&middot; ${formatCount(t.downloads || 0)} downloads</span>
          </div>
        </div>
        <button class="btn btn-primary install-btn" data-id="${t._id}" data-link="${escapeHtml(t.downloadLink)}">Install</button>
      </div>
    </div>
  `;
}

// ---------- app detail panel ----------

async function openAppDetail(id) {
  appDetailOverlay.classList.add('open');
  appDetailBody.innerHTML = `<div class="detail-loading"><span class="loader"><span></span><span></span><span></span></span></div>`;

  try {
    const [appRes, commentsRes] = await Promise.all([
      fetch(`/api/apps/${id}`),
      fetch(`/api/apps/${id}/comments`),
    ]);
    const t = await appRes.json();
    const comments = await commentsRes.json();
    if (!appRes.ok) throw new Error(t.error || 'Could not load this app.');

    renderAppDetail(t, comments);
  } catch (err) {
    appDetailBody.innerHTML = `<div class="status-msg show error">${escapeHtml(err.message)}</div>`;
  }
}

function renderAppDetail(t, comments) {
  const avg = t.ratingCount ? t.ratingSum / t.ratingCount : 0;

  const previews = (t.previewLinks || [])
    .slice(0, 8)
    .map(
      (p, i) =>
        `<a class="btn btn-ghost" href="${escapeHtml(p)}" target="_blank" rel="noopener noreferrer" style="padding:6px 10px;font-size:0.76rem;">Preview ${i + 1}</a>`
    )
    .join('');

  const commentsHtml = comments.length
    ? comments
        .map(
          (c) => `
      <div class="comment-item">
        <div class="comment-head"><span class="comment-user">${escapeHtml(c.username)}</span><span class="comment-time">${timeAgo(c.createdAt)}</span></div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      </div>
    `
        )
        .join('')
    : `<div class="notif-empty">No comments yet. Be the first to say something.</div>`;

  appDetailBody.innerHTML = `
    ${t.coverPhoto ? `<img class="detail-cover" src="${escapeHtml(t.coverPhoto)}" alt="${escapeHtml(t.name)}">` : ''}
    <h2 class="detail-name">${escapeHtml(t.name)}</h2>
    <div class="detail-sub">${escapeHtml(t.category || 'Other')} ${t.size ? `&middot; ${escapeHtml(t.size)}` : ''} ${t.ownerUsername ? `&middot; by ${escapeHtml(t.ownerUsername)}` : ''}</div>

    <div class="detail-rating-row">
      <span class="app-stars">${starsHtml(avg, '1rem')}</span>
      <span class="app-rating-num">${avg ? avg.toFixed(1) : 'New'}</span>
      <span class="app-downloads">(${t.ratingCount || 0} rating${t.ratingCount === 1 ? '' : 's'})</span>
      <span class="app-downloads">&middot; ${formatCount(t.downloads || 0)} downloads</span>
    </div>

    <button class="btn btn-primary" id="detailInstallBtn" style="margin:14px 0;">
      <i class="fa-solid fa-download"></i> Install
    </button>

    ${t.description ? `<div class="tool-desc" style="margin-bottom:12px;">${escapeHtml(t.description)}</div>` : ''}
    ${t.ownerNumber ? `<div class="tool-meta" style="margin-bottom:12px;"><span><i class="fa-solid fa-phone"></i> ${escapeHtml(t.ownerNumber)}</span></div>` : ''}
    ${previews ? `<div class="result-actions" style="flex-wrap:wrap;margin-bottom:16px;">${previews}</div>` : ''}

    <div class="star-rate" id="detailStarRate" data-id="${t._id}">
      <span style="font-size:0.78rem;color:var(--text-muted);margin-right:6px;">Rate this app:</span>
      ${[1, 2, 3, 4, 5].map((v) => `<i class="fa-solid fa-star" data-value="${v}"></i>`).join('')}
    </div>

    <div class="comments-section">
      <div class="comments-head"><i class="fa-solid fa-comments"></i> Comments (${comments.length})</div>

      ${currentUser
        ? `<div class="comment-form">
            <textarea id="commentInput" placeholder="Write a comment..." maxlength="300"></textarea>
            <button class="btn btn-primary" id="postCommentBtn" style="width:auto;padding:9px 16px;font-size:0.82rem;">Post</button>
          </div>`
        : `<div class="status-msg show error">
            <a href="/login" style="text-decoration:underline;">Log in</a> to write a comment.
          </div>`
      }

      <div class="comments-list" id="commentsList">${commentsHtml}</div>
    </div>
  `;

  document.getElementById('detailInstallBtn').addEventListener('click', () => recordDownload(t._id, t.downloadLink));

  document.getElementById('detailStarRate').querySelectorAll('i').forEach((star) => {
    star.addEventListener('click', async () => {
      const value = Number(star.dataset.value);
      try {
        const res = await fetch(`/api/apps/${t._id}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stars: value }),
        });
        const data = await res.json();
        if (res.ok) {
          t.ratingSum = data.ratingSum;
          t.ratingCount = data.ratingCount;
          const idx = allTools.findIndex((x) => x._id === t._id);
          if (idx >= 0) allTools[idx] = { ...allTools[idx], ratingSum: data.ratingSum, ratingCount: data.ratingCount };
          renderAppDetail(t, comments);
          render();
        }
      } catch (err) {
        // silent
      }
    });
  });

  const postBtn = document.getElementById('postCommentBtn');
  if (postBtn) {
    postBtn.addEventListener('click', async () => {
      const input = document.getElementById('commentInput');
      const text = input.value.trim();
      if (!text) return;

      postBtn.disabled = true;
      try {
        const res = await fetch(`/api/apps/${t._id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not post this comment.');

        comments.unshift(data);
        renderAppDetail(t, comments);
      } catch (err) {
        alert(err.message);
      } finally {
        postBtn.disabled = false;
      }
    });
  }
}

function closeAppDetail() {
  appDetailOverlay.classList.remove('open');
}
appDetailClose.addEventListener('click', closeAppDetail);
appDetailOverlay.addEventListener('click', (e) => {
  if (e.target === appDetailOverlay) closeAppDetail();
});

async function loadTools() {
  try {
    const sortParam = mode === 'top' ? '?sort=top' : '';
    const res = await fetch(`/api/apps${sortParam}`);
    allTools = await res.json();
    render();
  } catch (err) {
    emptyState.style.display = 'block';
  }
}

searchInput.addEventListener('input', render);
loadCurrentUser().then(loadTools);
