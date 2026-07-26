const toolList = document.getElementById('toolList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryRow = document.getElementById('categoryRow');

let allTools = [];
let activeCategory = 'All';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

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

  toolList.innerHTML = filtered
    .map(
      (t) => `
    <div class="tool-card">
      <div class="tool-card-top">
        <div class="tool-name">${escapeHtml(t.name)}</div>
        <span class="chip">${escapeHtml(t.category || 'Other')}</span>
      </div>
      ${t.description ? `<div class="tool-desc">${escapeHtml(t.description)}</div>` : ''}
      <div class="tool-meta">
        ${t.size ? `<span><i class="fa-solid fa-database"></i> ${escapeHtml(t.size)}</span>` : ''}
        ${t.ownerNumber ? `<span><i class="fa-solid fa-phone"></i> ${escapeHtml(t.ownerNumber)}</span>` : ''}
      </div>
      <div class="tool-card-actions">
        <a class="btn btn-primary" href="${escapeHtml(t.link)}" target="_blank" rel="noopener noreferrer">
          <i class="fa-solid fa-up-right-from-square"></i> Open
        </a>
      </div>
    </div>
  `
    )
    .join('');
}

async function loadTools() {
  try {
    const res = await fetch('/api/tools');
    allTools = await res.json();
    render();
  } catch (err) {
    emptyState.style.display = 'block';
  }
}

searchInput.addEventListener('input', render);
loadTools();
