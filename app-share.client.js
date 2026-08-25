(function () {
  const downloadBtn = document.getElementById('shareDownloadBtn');
  const shareBtn = document.getElementById('shareAgainBtn');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      const id = downloadBtn.dataset.id;
      const link = downloadBtn.dataset.link;
      try {
        await fetch(`/api/apps/${id}/download`, { method: 'POST' });
      } catch (err) {
        // silent - still let the download proceed
      }
      window.open(link, '_blank', 'noopener');
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const url = shareBtn.dataset.url;
      const title = document.title;

      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          return;
        } catch (err) {
          // user cancelled, or share isn't supported here - fall back to copy
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        const original = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="fa-solid fa-check"></i> Link copied!';
        setTimeout(() => {
          shareBtn.innerHTML = original;
        }, 1800);
      } catch (err) {
        prompt('Copy this link to share:', url);
      }
    });
  }
})();
