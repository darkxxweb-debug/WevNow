const express = require('express');
const router = express.Router();
const Tool = require('./Tool.model');

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

// POST /api/tools - add a new tool/app
router.post('/api/tools', async (req, res) => {
  try {
    const { name, link, category, size, ownerNumber, description } = req.body;

    if (!name || !link) {
      return res.status(400).json({ error: 'Name and link are required.' });
    }

    const tool = await Tool.create({
      name,
      link,
      category,
      size,
      ownerNumber,
      description,
    });

    res.status(201).json(tool);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not add this tool.' });
  }
});

// DELETE /api/tools/:id
router.delete('/api/tools/:id', async (req, res) => {
  try {
    await Tool.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete this tool.' });
  }
});

module.exports = router;
