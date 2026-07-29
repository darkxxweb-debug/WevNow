const slug = document.body.dataset.slug;
const panelTitle = document.getElementById('panelTitle');
const panelSub = document.getElementById('panelSub');
const submitForm = document.getElementById('submitForm');
const submitBtn = document.getElementById('submitBtn');
const statusMsg = document.getElementById('statusMsg');
const ownerBox = document.getElementById('ownerBox');
const countInfo = document.getElementById('countInfo');
const downloadLink = document.getElementById('downloadLink');
const countrySelect = document.getElementById('country');
const dialCodePrefix = document.getElementById('dialCodePrefix');
const numberInput = document.getElementById('number');

// ---------- country picker ----------
if (typeof COUNTRIES !== 'undefined' && countrySelect) {
  countrySelect.innerHTML = COUNTRIES.map(
    (c) => `<option value="${c.d}">${c.n} (+${c.d})</option>`
  ).join('');

  const defaultIndex = COUNTRIES.findIndex((c) => c.c === 'TZ');
  if (defaultIndex >= 0) countrySelect.selectedIndex = defaultIndex;
  dialCodePrefix.textContent = `+${countrySelect.value}`;

  countrySelect.addEventListener('change', () => {
    dialCodePrefix.textContent = `+${countrySelect.value}`;
  });
}

async function loadPanel() {
  try {
    const res = await fetch(`/api/vcf/${slug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Panel not found.');

    panelTitle.textContent = data.title;
    panelSub.textContent = `Add your number below to join "${data.title}".`;

    if (data.isOwner || data.isAdmin) {
      countInfo.textContent = `${data.count} number${data.count === 1 ? '' : 's'} saved so far`;
      downloadLink.href = `/api/vcf/${slug}/download`;
      ownerBox.style.display = 'block';
    }

    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      submitForm.style.display = 'none';
      statusMsg.textContent = 'This panel has expired and is no longer accepting numbers.';
      statusMsg.className = 'status-msg show error';
    }
  } catch (err) {
    panelTitle.textContent = 'Panel not found';
    panelSub.textContent = err.message;
    submitForm.style.display = 'none';
  }
}

submitForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const countryCode = countrySelect.value;
  const number = numberInput.value.trim().replace(/^0+/, '');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loader"><span></span><span></span><span></span></span> Saving...';

  try {
    const res = await fetch(`/api/vcf/${slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fullName, countryCode, number }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save your number.');

    statusMsg.textContent = 'Saved! Thank you for joining.';
    statusMsg.className = 'status-msg show info';
    submitForm.reset();
    if (typeof COUNTRIES !== 'undefined') {
      const defaultIndex = COUNTRIES.findIndex((c) => c.c === 'TZ');
      if (defaultIndex >= 0) countrySelect.selectedIndex = defaultIndex;
      dialCodePrefix.textContent = `+${countrySelect.value}`;
    }
  } catch (err) {
    statusMsg.textContent = err.message;
    statusMsg.className = 'status-msg show error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save my number';
  }
});

loadPanel();
