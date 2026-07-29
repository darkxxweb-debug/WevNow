const myReferralBox = document.getElementById('myReferralBox');
const myRefLink = document.getElementById('myRefLink');
const copyRefBtn = document.getElementById('copyRefBtn');
const loginNotice = document.getElementById('loginNotice');
const leaderboardList = document.getElementById('leaderboardList');
const emptyState = document.getElementById('emptyState');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function loadMe() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.user) {
      myRefLink.value = `${window.location.origin}/register?ref=${data.user.referralCode}`;
      myReferralBox.style.display = 'block';
    } else {
      loginNotice.style.display = 'block';
    }
  } catch (err) {
    // silent
  }
}

copyRefBtn.addEventListener('click', () => {
  myRefLink.select();
  navigator.clipboard.writeText(myRefLink.value).catch(() => {});
  copyRefBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
  setTimeout(() => (copyRefBtn.innerHTML = '<i class="fa-solid fa-copy"></i>'), 1200);
});

async function loadLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    const rows = await res.json();

    if (!rows.length) {
      emptyState.style.display = 'block';
      return;
    }

    leaderboardList.innerHTML = rows
      .map(
        (r, i) => `
      <div class="lb-row">
        <div class="lb-rank">${i + 1}</div>
        <div class="lb-info">
          <div class="lb-name">${escapeHtml(r.username)}</div>
          <div class="lb-count">${r.referralCount} invite${r.referralCount === 1 ? '' : 's'}</div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    emptyState.style.display = 'block';
  }
}

loadMe();
loadLeaderboard();
