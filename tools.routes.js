const express = require('express');
const router = express.Router();
const Tool = require('./Tool.model');
const { requireAuth, requireAdmin } = require('./middleware');

// GET /api/tools - list all, optional ?q= search, ?category=, ?sort= (new|top|rating)
router.get('/api/tools', async (req, res) => {
  try {
    const { q, category, sort } = req.query;
    const filter = {};

    if (q) {
      filter.name = { $regex: q, $options: 'i' };
    }
    if (category && category !== 'All') {
      filter.category = category;
    }

    let sortBy = { createdAt: -1 };
    if (sort === 'top') sortBy = { downloads: -1, createdAt: -1 };

    const tools = await Tool.find(filter).sort(sortBy);
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

// POST /api/tools/:id/download - counts a download. Called right before the
// browser opens the tool's downloadLink.
router.post('/api/tools/:id/download', async (req, res) => {
  try {
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!tool) return res.status(404).json({ error: 'Tool not found.' });
    res.json({ downloads: tool.downloads });
  } catch (err) {
    res.status(400).json({ error: 'Could not record this download.' });
  }
});

// POST /api/tools/:id/rate  { stars: 1-5 }
router.post('/api/tools/:id/rate', async (req, res) => {
  try {
    const stars = Number(req.body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' });
    }

    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      { $inc: { ratingSum: stars, ratingCount: 1 } },
      { new: true }
    );
    if (!tool) return res.status(404).json({ error: 'Tool not found.' });

    res.json({
      ratingSum: tool.ratingSum,
      ratingCount: tool.ratingCount,
      average: tool.ratingCount ? tool.ratingSum / tool.ratingCount : 0,
    });
  } catch (err) {
    res.status(400).json({ error: 'Could not save your rating.' });
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
