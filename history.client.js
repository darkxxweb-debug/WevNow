const historyList = document.getElementById('historyList');
const emptyState = document.getElementById('emptyState');

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

async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const items = await res.json();

    if (!items.length) {
      emptyState.style.display = 'block';
      return;
    }

    historyList.innerHTML = items
      .map(
        (item) => `
      <div class="tool-card">
        <div class="tool-card-top">
          <div class="tool-name">${escapeHtml(item.title)}</div>
          <span class="chip mono">${timeAgo(item.createdAt)}</span>
        </div>
        <div class="tool-card-actions">
          ${item.audioUrl ? `<a class="btn btn-teal" href="${escapeHtml(item.audioUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-music"></i> Audio</a>` : ''}
          ${item.videoUrl ? `<a class="btn btn-ghost" href="${escapeHtml(item.videoUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-video"></i> Video</a>` : ''}
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    emptyState.style.display = 'block';
  }
}

loadHistory();
