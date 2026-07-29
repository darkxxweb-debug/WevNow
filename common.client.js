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

// ---------- announcement banner ----------
async function loadAnnouncement() {
  const banner = document.getElementById('announceBanner');
  if (!banner) return;
  try {
    const res = await fetch('/api/announcements/active');
    const data = await res.json();
    if (data.announcement && data.announcement.message) {
      banner.innerHTML = `<i class="fa-solid fa-bullhorn"></i> <span>${data.announcement.message}</span>`;
      banner.style.display = 'flex';
    }
  } catch (err) {
    // silent
  }
}
loadAnnouncement();

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
