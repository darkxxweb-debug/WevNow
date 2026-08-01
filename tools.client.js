const toolList = document.getElementById('toolList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryRow = document.getElementById('categoryRow');
const storeTabs = document.getElementById('storeTabs');

let allTools = [];
let activeCategory = 'All';
let mode = 'new';

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

function starsHtml(avg) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(avg);
    html += `<i class="fa-${filled ? 'solid' : 'regular'} fa-star" style="color:${filled ? 'var(--accent)' : 'var(--text-muted)'};"></i>`;
  }
  return html;
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
      if (e.target.closest('.install-btn') || e.target.closest('.star-rate')) return;
      row.classList.toggle('expanded');
    });
  });

  toolList.querySelectorAll('.install-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const link = btn.dataset.link;
      try {
        await fetch(`/api/tools/${id}/download`, { method: 'POST' });
      } catch (err) {
        // silent - still let the download proceed
      }
      window.open(link, '_blank', 'noopener');
    });
  });

  toolList.querySelectorAll('.star-rate i').forEach((star) => {
    star.addEventListener('click', async (e) => {
      e.stopPropagation();
      const wrap = star.closest('.star-rate');
      const id = wrap.dataset.id;
      const value = Number(star.dataset.value);
      try {
        const res = await fetch(`/api/tools/${id}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stars: value }),
        });
        const data = await res.json();
        if (res.ok) {
          const tool = allTools.find((t) => t._id === id);
          if (tool) {
            tool.ratingSum = data.ratingSum;
            tool.ratingCount = data.ratingCount;
          }
          render();
        }
      } catch (err) {
        // silent
      }
    });
  });
}

function appRowHtml(t) {
  const avg = t.ratingCount ? t.ratingSum / t.ratingCount : 0;
  const previews = (t.previewLinks || [])
    .slice(0, 8)
    .map(
      (p, i) =>
        `<a class="btn btn-ghost" href="${escapeHtml(p)}" target="_blank" rel="noopener noreferrer" style="padding:6px 10px;font-size:0.76rem;">Preview ${i + 1}</a>`
    )
    .join('');

  return `
    <div class="app-row">
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

      <div class="app-row-expand">
        ${t.description ? `<div class="tool-desc">${escapeHtml(t.description)}</div>` : ''}
        ${t.ownerNumber || t.ownerUsername ? `<div class="tool-meta">
          ${t.ownerNumber ? `<span><i class="fa-solid fa-phone"></i> ${escapeHtml(t.ownerNumber)}</span>` : ''}
          ${t.ownerUsername ? `<span><i class="fa-solid fa-user"></i> ${escapeHtml(t.ownerUsername)}</span>` : ''}
        </div>` : ''}
        ${previews ? `<div class="result-actions" style="flex-wrap:wrap;margin:8px 0;">${previews}</div>` : ''}
        <div class="star-rate" data-id="${t._id}">
          <span style="font-size:0.78rem;color:var(--text-muted);margin-right:6px;">Rate this app:</span>
          ${[1, 2, 3, 4, 5].map((v) => `<i class="fa-solid fa-star" data-value="${v}"></i>`).join('')}
        </div>
      </div>
    </div>
  `;
}

async function loadTools() {
  try {
    const sortParam = mode === 'top' ? '?sort=top' : '';
    const res = await fetch(`/api/tools${sortParam}`);
    allTools = await res.json();
    render();
  } catch (err) {
    emptyState.style.display = 'block';
  }
}

searchInput.addEventListener('input', render);
loadTools();
