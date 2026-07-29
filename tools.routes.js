const express = require('express');
const router = express.Router();
const Tool = require('./Tool.model');
const { requireAuth, requireAdmin } = require('./middleware');

// GET /api/tools - list all, newest first, optional ?q= search, ?category=
router.get('/api/tools', async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = {};

    if (q) {
      filter.name = { $regex: q, $options: 'i' };
    }
    if (category && category !== 'All') {
      filter.category = category;
    }

    const tools = await Tool.find(filter).sort({ createdAt: -1 });
    res.json(tools);
  } catch (err) {
    res.status(500).json({ error: 'Could not load tools.' });
  }
});

// POST /api/tools - add a new tool/app. Must be a registered, logged-in user.
router.post('/api/tools', requireAuth, async (req, res) => {
  try {
    const {
      name,
      coverPhoto,
      previewLinks,
      downloadLink,
      category,
      size,
      ownerNumber,
      description,
    } = req.body;

    if (!name || !downloadLink) {
      return res.status(400).json({ error: 'Name and download link are required.' });
    }

    const cleanPreviews = Array.isArray(previewLinks)
      ? previewLinks.map((l) => (l || '').trim()).filter(Boolean).slice(0, 8)
      : [];

    const tool = await Tool.create({
      name,
      coverPhoto: (coverPhoto || '').trim(),
      previewLinks: cleanPreviews,
      downloadLink,
      category,
      size,
      ownerNumber,
      description,
      ownerUser: req.session.userId,
      ownerUsername: req.session.username || '',
    });

    res.status(201).json(tool);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not add this tool.' });
  }
});

// DELETE /api/tools/:id - admin only, from the site manager
router.delete('/api/tools/:id', requireAdmin, async (req, res) => {
  try {
    await Tool.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete this tool.' });
  }
});

module.exports = router;
