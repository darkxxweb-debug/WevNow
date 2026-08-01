const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('./User.model');
const Tool = require('./Tool.model');
const WhatsappGroup = require('./WhatsappGroup.model');
const Announcement = require('./Announcement.model');
const VcfPanel = require('./VcfPanel.model');
const { requireAdmin } = require('./middleware');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function makeSlug() {
  let slug;
  do {
    slug = crypto.randomBytes(4).toString('hex');
  } while (await VcfPanel.findOne({ slug }));
  return slug;
}

// ---------- unlock ----------

// POST /api/admin/login { password }
router.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  req.session.isAdmin = true;
  res.json({ success: true });
});

// POST /api/admin/logout
router.post('/api/admin/logout', (req, res) => {
  if (req.session) req.session.isAdmin = false;
  res.json({ success: true });
});

// GET /api/admin/session - is the panel currently unlocked in this session?
router.get('/api/admin/session', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ---------- public announcement banner (no admin required) ----------

// GET /api/announcements/active
router.get('/api/announcements/active', async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ active: true }).sort({ createdAt: -1 });
    res.json({ announcement });
  } catch (err) {
    res.json({ announcement: null });
  }
});

// ---------- everything below requires the admin panel to be unlocked ----------

router.use('/api/admin', requireAdmin);

// stats overview
router.get('/api/admin/stats', async (req, res) => {
  try {
    const [users, tools, groups, vcfPanels] = await Promise.all([
      User.countDocuments(),
      Tool.countDocuments(),
      WhatsappGroup.countDocuments(),
      VcfPanel.countDocuments(),
    ]);
    res.json({ users, tools, groups, vcfPanels });
  } catch (err) {
    res.status(500).json({ error: 'Could not load stats.' });
  }
});

// users
router.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('username referralCode createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Could not load users.' });
  }
});

router.delete('/api/admin/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete this user.' });
  }
});

// announcements
router.get('/api/admin/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Could not load announcements.' });
  }
});

router.post('/api/admin/announcements', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });
    // Only one active announcement banner at a time
    await Announcement.updateMany({}, { active: false });
    const announcement = await Announcement.create({ message: message.trim(), active: true });
    res.status(201).json(announcement);
  } catch (err) {
    res.status(400).json({ error: 'Could not post the announcement.' });
  }
});

router.delete('/api/admin/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete this announcement.' });
  }
});

// ---------- vcf oversight: every panel on the site (user + admin created) ----------
router.get('/api/admin/vcf', async (req, res) => {
  try {
    const panels = await VcfPanel.find().sort({ createdAt: -1 });
    res.json(panels);
  } catch (err) {
    res.status(500).json({ error: 'Could not load VCF panels.' });
  }
});

// admin can also create its own promotional panels the same way a user would
router.post('/api/admin/vcf', async (req, res) => {
  try {
    const { title, coverPhoto, targetCount, durationHours, isPublic } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const slug = await makeSlug();
    const hours = Number(durationHours) || 0;
    const expiresAt = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;

    const panel = await VcfPanel.create({
      slug,
      title: title.trim(),
      coverPhoto: (coverPhoto || '').trim(),
      type: 'admin',
      ownerUsername: 'admin',
      targetCount: Number(targetCount) || 0,
      durationHours: hours,
      expiresAt,
      isPublic: !!isPublic,
    });

    res.status(201).json(panel);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not create the panel.' });
  }
});

// Push, lock, visibility, download, and delete for any panel (including
// user-owned ones) are handled by the generalized routes in vcf.routes.js -
// the admin session automatically passes their ownerOrAdmin() check there.

module.exports = router;
