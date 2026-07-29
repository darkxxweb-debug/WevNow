function showStatus(el, message, type) {
  el.textContent = message;
  el.className = `status-msg show ${type}`;
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const refInput = document.getElementById('refCode');
  const params = new URLSearchParams(window.location.search);
  if (refInput && params.get('ref')) refInput.value = params.get('ref');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('statusMsg');
    const submitBtn = document.getElementById('submitBtn');

    const payload = {
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value,
      ref: document.getElementById('refCode').value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Creating account...';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not register.');

      showStatus(statusMsg, 'Account created! Redirecting...', 'info');
      setTimeout(() => (window.location.href = '/referrals'), 800);
    } catch (err) {
      showStatus(statusMsg, err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register';
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('statusMsg');
    const submitBtn = document.getElementById('submitBtn');

    const payload = {
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value,
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Logging in...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not log in.');

      showStatus(statusMsg, 'Welcome back! Redirecting...', 'info');
      setTimeout(() => (window.location.href = '/'), 700);
    } catch (err) {
      showStatus(statusMsg, err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Log in';
    }
  });
}
