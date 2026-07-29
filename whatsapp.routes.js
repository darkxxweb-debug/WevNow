const express = require('express');
const router = express.Router();
const WhatsappGroup = require('./WhatsappGroup.model');
const { requireAuth, requireAdmin } = require('./middleware');

const LINK_PATTERN = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;

// GET /api/whatsapp - most popular (most clicked) groups first
router.get('/api/whatsapp', async (req, res) => {
  try {
    const groups = await WhatsappGroup.find().sort({ clicks: -1, createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Could not load WhatsApp groups.' });
  }
});

// POST /api/whatsapp - add a new group link. Must be logged in.
router.post('/api/whatsapp', requireAuth, async (req, res) => {
  try {
    const { name, link } = req.body;

    if (!name || !link) {
      return res.status(400).json({ error: 'Group name and link are required.' });
    }
    if (!LINK_PATTERN.test(link.trim())) {
      return res.status(400).json({ error: 'Link must look like https://chat.whatsapp.com/xxxxxxxx' });
    }

    const group = await WhatsappGroup.create({
      name: name.trim(),
      link: link.trim(),
      addedBy: req.session.userId,
      addedByUsername: req.session.username || '',
    });

    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not add this group.' });
  }
});

// POST /api/whatsapp/:id/click - bump the popularity counter, return the link to redirect to
router.post('/api/whatsapp/:id/click', async (req, res) => {
  try {
    const group = await WhatsappGroup.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    res.json({ link: group.link });
  } catch (err) {
    res.status(400).json({ error: 'Could not open this group.' });
  }
});

// DELETE /api/whatsapp/:id - admin only
router.delete('/api/whatsapp/:id', requireAdmin, async (req, res) => {
  try {
    await WhatsappGroup.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete this group.' });
  }
});

module.exports = router;
