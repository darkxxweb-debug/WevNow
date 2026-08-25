const express = require('express');
const router = express.Router();
const Tool = require('./Tool.model');
const Comment = require('./Comment.model');
const { requireAuth, requireAdmin } = require('./middleware');

function ownerOrAdmin(req, app) {
  const isOwner = !!(req.session && req.session.userId && String(req.session.userId) === String(app.ownerUser));
  const isAdmin = !!(req.session && req.session.isAdmin);
  return { isOwner, isAdmin };
}

// GET /api/apps - list all, optional ?q= search, ?category=, ?sort= (new|top|rating)
router.get('/api/apps', async (req, res) => {
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

    const apps = await Tool.find(filter).sort(sortBy);
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Could not load apps.' });
  }
});

// GET /api/apps/mine - apps uploaded by the current user
router.get('/api/apps/mine', requireAuth, async (req, res) => {
  try {
    const apps = await Tool.find({ ownerUser: req.session.userId }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Could not load your apps.' });
  }
});

// GET /api/apps/:id - single app detail (used by the detail panel)
router.get('/api/apps/:id', async (req, res) => {
  try {
    const app = await Tool.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'App not found.' });
    res.json(app);
  } catch (err) {
    res.status(400).json({ error: 'Could not load this app.' });
  }
});

// POST /api/apps - upload a new app/tool. Must be a registered, logged-in user.
router.post('/api/apps', requireAuth, async (req, res) => {
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

    const app = await Tool.create({
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

    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not add this app.' });
  }
});

// PUT /api/apps/:id - edit an app. Owner (their own upload) or admin only.
router.put('/api/apps/:id', async (req, res) => {
  try {
    const app = await Tool.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'App not found.' });

    const { isOwner, isAdmin } = ownerOrAdmin(req, app);
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ error: 'You do not have access to edit this app.' });
    }

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

    if (name !== undefined) app.name = name;
    if (coverPhoto !== undefined) app.coverPhoto = (coverPhoto || '').trim();
    if (downloadLink !== undefined) app.downloadLink = downloadLink;
    if (category !== undefined) app.category = category;
    if (size !== undefined) app.size = size;
    if (ownerNumber !== undefined) app.ownerNumber = ownerNumber;
    if (description !== undefined) app.description = description;
    if (Array.isArray(previewLinks)) {
      app.previewLinks = previewLinks.map((l) => (l || '').trim()).filter(Boolean).slice(0, 8);
    }

    if (!app.name || !app.downloadLink) {
      return res.status(400).json({ error: 'Name and download link are required.' });
    }

    await app.save();
    res.json(app);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not update this app.' });
  }
});

// POST /api/apps/:id/download - counts a download. Called right before the
// browser opens the app's downloadLink.
router.post('/api/apps/:id/download', async (req, res) => {
  try {
    const app = await Tool.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!app) return res.status(404).json({ error: 'App not found.' });
    res.json({ downloads: app.downloads });
  } catch (err) {
    res.status(400).json({ error: 'Could not record this download.' });
  }
});

// POST /api/apps/:id/rate  { stars: 1-5 }
router.post('/api/apps/:id/rate', async (req, res) => {
  try {
    const stars = Number(req.body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' });
    }

    const app = await Tool.findByIdAndUpdate(
      req.params.id,
      { $inc: { ratingSum: stars, ratingCount: 1 } },
      { new: true }
    );
    if (!app) return res.status(404).json({ error: 'App not found.' });

    res.json({
      ratingSum: app.ratingSum,
      ratingCount: app.ratingCount,
      average: app.ratingCount ? app.ratingSum / app.ratingCount : 0,
    });
  } catch (err) {
    res.status(400).json({ error: 'Could not save your rating.' });
  }
});

// ---------- comments ----------

// GET /api/apps/:id/comments
router.get('/api/apps/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ appId: req.params.id }).sort({ createdAt: -1 }).limit(100);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Could not load comments.' });
  }
});

// POST /api/apps/:id/comments  { text } - must be logged in
router.post('/api/apps/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' });
    }

    const app = await Tool.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'App not found.' });

    const comment = await Comment.create({
      appId: app._id,
      username: req.session.username || 'user',
      text: text.trim().slice(0, 300),
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not post this comment.' });
  }
});

// DELETE /api/apps/:appId/comments/:commentId - admin only, for moderation
router.delete('/api/apps/:appId/comments/:commentId', requireAdmin, async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete this comment.' });
  }
});

// ---------- public share page ----------
// GET /apps/share/:id - a public, no-login-required page for exactly one
// app. This is the link people get from the Share button: opening it shows
// a preview of that single app (name, cover, description, rating) with a
// big Download button, and unfurls nicely when pasted into WhatsApp thanks
// to the Open Graph tags in app-share.ejs.
router.get('/apps/share/:id', async (req, res) => {
  try {
    const app = await Tool.findById(req.params.id);
    if (!app) return res.status(404).render('404', { active: '' });

    const shareUrl = `${req.protocol}://${req.get('host')}/apps/share/${app._id}`;
    res.render('app-share', { active: '', app, shareUrl });
  } catch (err) {
    return res.status(404).render('404', { active: '' });
  }
});

// DELETE /api/apps/:id - owner of the app, or admin
router.delete('/api/apps/:id', async (req, res) => {
  try {
    const app = await Tool.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'App not found.' });

    const { isOwner, isAdmin } = ownerOrAdmin(req, app);
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ error: 'You do not have access to delete this app.' });
    }

    await Tool.deleteOne({ _id: app._id });
    await Comment.deleteMany({ appId: app._id });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete this app.' });
  }
});

module.exports = router;
