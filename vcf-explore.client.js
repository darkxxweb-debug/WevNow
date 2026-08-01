const explorePanelList = document.getElementById('explorePanelList');
const emptyState = document.getElementById('emptyState');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function loadExplore() {
  try {
    const res = await fetch('/api/vcf/explore');
    const panels = await res.json();

    if (!panels.length) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    explorePanelList.innerHTML = panels
      .map((p, i) => {
        const progress = p.targetCount > 0 ? `${p.count}/${p.targetCount}` : `${p.count}`;
        return `
      <div class="vcf-card">
        ${p.coverPhoto ? `<img src="${escapeHtml(p.coverPhoto)}" alt="" style="width:100%;border-radius:10px;margin-bottom:10px;max-height:140px;object-fit:cover;">` : ''}
        <div class="vcf-card-top">
          <div class="vcf-title">${i === 0 ? '<i class="fa-solid fa-fire" style="color:var(--accent);"></i> ' : ''}${escapeHtml(p.title)}</div>
          <span class="chip">${escapeHtml(progress)} numbers</span>
        </div>
        <div class="vcf-meta">
          ${p.downloadEnabled ? '<i class="fa-solid fa-circle-check" style="color:var(--teal);"></i> Downloads open' : '<i class="fa-solid fa-hourglass-half"></i> Collecting numbers'}
          &middot; ${p.views} view${p.views === 1 ? '' : 's'}
        </div>
        <div class="vcf-actions">
          <a class="btn btn-ghost" href="/vcf/${p.slug}"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open panel</a>
        </div>
      </div>
    `;
      })
      .join('');
  } catch (err) {
    emptyState.style.display = 'block';
  }
}

loadExplore();
