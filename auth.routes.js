const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();
const User = require('./User.model');

function makeReferralCode(username) {
  const base = (username || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
  const rand = crypto.randomBytes(3).toString('hex');
  return `${base || 'user'}${rand}`;
}

// POST /api/auth/register  { username, password, ref? }
router.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, ref } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (password.length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters.' });
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(400).json({ error: 'That username is already taken.' });
    }

    let referredBy = null;
    if (ref) {
      const referrer = await User.findOne({ referralCode: ref.trim() });
      if (referrer) referredBy = referrer._id;
    }

    let referralCode = makeReferralCode(username);
    // Ensure uniqueness (extremely unlikely to collide, but just in case)
    while (await User.findOne({ referralCode })) {
      referralCode = makeReferralCode(username);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.trim(),
      passwordHash,
      referralCode,
      referredBy,
    });

    req.session.userId = user._id;
    req.session.username = user.username;

    res.status(201).json({
      id: user._id,
      username: user.username,
      referralCode: user.referralCode,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not register.' });
  }
});

// POST /api/auth/login  { username, password }
router.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    req.session.userId = user._id;
    req.session.username = user.username;

    res.json({ id: user._id, username: user.username, referralCode: user.referralCode });
  } catch (err) {
    res.status(400).json({ error: 'Could not log in.' });
  }
});

// POST /api/auth/logout
router.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/api/auth/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ user: null });
  }
  try {
    const user = await User.findById(req.session.userId).select('username referralCode createdAt');
    if (!user) return res.json({ user: null });
    res.json({ user });
  } catch (err) {
    res.json({ user: null });
  }
});

module.exports = router;
