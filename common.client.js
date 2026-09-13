// ---------- side menu open/close ----------
const sideMenu = document.getElementById('sideMenu');
const sideOverlay = document.getElementById('sideOverlay');
const sideCloseBtn = document.getElementById('sideCloseBtn');

function openSideMenu() {
  sideMenu.classList.add('open');
  sideOverlay.classList.add('open');
}
function closeSideMenu() {
  sideMenu.classList.remove('open');
  sideOverlay.classList.remove('open');
}

document.querySelectorAll('.menu-toggle').forEach((btn) => {
  btn.addEventListener('click', openSideMenu);
});
if (sideCloseBtn) sideCloseBtn.addEventListener('click', closeSideMenu);
if (sideOverlay) sideOverlay.addEventListener('click', closeSideMenu);

// ---------- notification bell ----------
const notifBell = document.getElementById('notifBell');
const notifDot = document.getElementById('notifDot');
const notifPanel = document.getElementById('notifPanel');
const notifPanelBody = document.getElementById('notifPanelBody');

function timeAgoShort(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

async function loadAnnouncement() {
  if (!notifBell) return;
  try {
    const res = await fetch('/api/announcements/active');
    const data = await res.json();

    if (data.announcement && data.announcement.message) {
      const a = data.announcement;
      notifPanelBody.innerHTML = `
        <div class="notif-item">
          <div class="notif-item-msg">${a.message}</div>
          <div class="notif-item-time">${timeAgoShort(a.createdAt)}</div>
        </div>`;

      const seenId = localStorage.getItem('wh_seen_announcement');
      if (seenId !== a._id) {
        notifDot.style.display = 'block';
      }
    } else {
      notifPanelBody.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
    }
  } catch (err) {
    // silent
  }
}
loadAnnouncement();

if (notifBell) {
  notifBell.addEventListener('click', async (e) => {
    e.stopPropagation();
    notifPanel.classList.toggle('open');
    if (notifPanel.classList.contains('open')) {
      notifDot.style.display = 'none';
      try {
        const res = await fetch('/api/announcements/active');
        const data = await res.json();
        if (data.announcement) localStorage.setItem('wh_seen_announcement', data.announcement._id);
      } catch (err) {
        // silent
      }
    }
  });
  document.addEventListener('click', (e) => {
    if (!notifPanel.contains(e.target) && e.target !== notifBell) {
      notifPanel.classList.remove('open');
    }
  });
}

// ---------- auth state in side menu ----------
async function loadAuthState() {
  const loginLink = document.getElementById('sideLoginLink');
  const registerLink = document.getElementById('sideRegisterLink');
  const logoutBtn = document.getElementById('sideLogoutBtn');
  if (!loginLink) return;

  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.user) {
      loginLink.style.display = 'none';
      registerLink.style.display = 'none';
      logoutBtn.style.display = 'flex';
      logoutBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Log out (${data.user.username})`;
    }
  } catch (err) {
    // silent
  }
}
loadAuthState();

const sideLogoutBtn = document.getElementById('sideLogoutBtn');
if (sideLogoutBtn) {
  sideLogoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

// ---------- hidden admin unlock ----------
const mrxonlyBtn = document.getElementById('mrxonlyBtn');
const adminModalOverlay = document.getElementById('adminModalOverlay');
const adminModalCancel = document.getElementById('adminModalCancel');
const adminModalSubmit = document.getElementById('adminModalSubmit');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminModalStatus = document.getElementById('adminModalStatus');

if (mrxonlyBtn) {
  mrxonlyBtn.addEventListener('click', () => {
    closeSideMenu();
    adminModalOverlay.classList.add('open');
    adminModalStatus.className = 'status-msg';
    adminPasswordInput.value = '';
    setTimeout(() => adminPasswordInput.focus(), 100);
  });
}
if (adminModalCancel) {
  adminModalCancel.addEventListener('click', () => adminModalOverlay.classList.remove('open'));
}
if (adminModalOverlay) {
  adminModalOverlay.addEventListener('click', (e) => {
    if (e.target === adminModalOverlay) adminModalOverlay.classList.remove('open');
  });
}

async function submitAdminPassword() {
  const password = adminPasswordInput.value;
  if (!password) return;
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Incorrect password.');
    window.location.href = '/admin';
  } catch (err) {
    adminModalStatus.textContent = err.message;
    adminModalStatus.className = 'status-msg show error';
  }
}
if (adminModalSubmit) adminModalSubmit.addEventListener('click', submitAdminPassword);
if (adminPasswordInput) {
  adminPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAdminPassword();
  });
}

// ---------- theme switcher (orange / light blue) ----------
const THEME_KEY = 'wh_theme';
const themeOptBtns = document.querySelectorAll('.theme-opt');

function applyTheme(theme) {
  if (theme === 'blue') {
    document.documentElement.setAttribute('data-theme', 'blue');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  themeOptBtns.forEach((b) => {
    b.classList.toggle('active', b.dataset.themeChoice === theme);
  });
}

if (themeOptBtns.length) {
  let savedTheme = 'orange';
  try {
    savedTheme = localStorage.getItem(THEME_KEY) || 'orange';
  } catch (e) {}
  applyTheme(savedTheme);

  themeOptBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeChoice;
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {}
      applyTheme(theme);
    });
  });
}

// ---------- WaveHub app promo popup ----------
const PROMO_DOWNLOADED_KEY = 'wh_app_downloaded';
const promoOverlay = document.getElementById('waveHubPromoOverlay');
const promoCloseBtn = document.getElementById('promoCloseBtn');
const promoDownloadBtn = document.getElementById('promoDownloadBtn');

if (promoOverlay) {
  let alreadyDownloaded = false;
  try {
    alreadyDownloaded = localStorage.getItem(PROMO_DOWNLOADED_KEY) === '1';
  } catch (e) {}

  if (!alreadyDownloaded) {
    setTimeout(() => promoOverlay.classList.add('open'), 500);
  }

  promoOverlay.addEventListener('click', (e) => {
    if (e.target === promoOverlay) promoOverlay.classList.remove('open');
  });
}
if (promoCloseBtn) {
  promoCloseBtn.addEventListener('click', () => promoOverlay.classList.remove('open'));
}
if (promoDownloadBtn) {
  promoDownloadBtn.addEventListener('click', () => {
    try {
      localStorage.setItem(PROMO_DOWNLOADED_KEY, '1');
    } catch (e) {}
    setTimeout(() => promoOverlay.classList.remove('open'), 300);
  });
}
