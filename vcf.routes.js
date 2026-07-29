const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const VcfPanel = require('./VcfPanel.model');
const { requireAuth } = require('./middleware');

async function makeSlug() {
  let slug;
  do {
    slug = crypto.randomBytes(4).toString('hex');
  } while (await VcfPanel.findOne({ slug }));
  return slug;
}

// A fixed promotional contact that must appear in every generated .vcf file
const CUSTOM_CONTACT = { name: 'DarkX-Ultra', number: '255775710774' };

function buildVcfText(panel) {
  const customCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${CUSTOM_CONTACT.name}\nTEL;TYPE=CELL:${CUSTOM_CONTACT.number}\nEND:VCARD`;

  const cards = panel.contacts.map((c, i) => {
    const num = `${c.countryCode}${c.number}`.replace(/\s+/g, '');
    const name = c.name && c.name.trim() ? c.name.trim() : `${panel.title} ${i + 1}`;
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:${num}\nEND:VCARD`;
  });

  return [customCard, ...cards].join('\n');
}

// POST /api/vcf - create a personal VCF collection panel (logged in users only)
router.post('/api/vcf', requireAuth, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Panel title is required.' });

    const slug = await makeSlug();
    const panel = await VcfPanel.create({
      slug,
      title: title.trim(),
      type: 'user',
      ownerUser: req.session.userId,
      ownerUsername: req.session.username || '',
      isPublic: false,
    });

    res.status(201).json(panel);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not create the panel.' });
  }
});

// GET /api/vcf/mine - panels owned by the current user
router.get('/api/vcf/mine', requireAuth, async (req, res) => {
  try {
    const panels = await VcfPanel.find({ ownerUser: req.session.userId }).sort({ createdAt: -1 });
    res.json(panels);
  } catch (err) {
    res.status(500).json({ error: 'Could not load your panels.' });
  }
});

// GET /api/vcf/explore - public admin panels, most popular (most contacts) first
router.get('/api/vcf/explore', async (req, res) => {
  try {
    const panels = await VcfPanel.find({ type: 'admin', isPublic: true })
      .select('slug title contacts targetCount pushed views createdAt expiresAt')
      .sort({ views: -1, createdAt: -1 });

    const withCounts = panels
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        count: p.contacts.length,
        targetCount: p.targetCount,
        pushed: p.pushed,
        views: p.views,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt,
      }))
      .sort((a, b) => b.count - a.count);

    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ error: 'Could not load public VCF panels.' });
  }
});

// GET /api/vcf/:slug - panel metadata (used by the submission page). Anyone with the link can view it.
router.get('/api/vcf/:slug', async (req, res) => {
  try {
    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    panel.views += 1;
    await panel.save();

    res.json({
      slug: panel.slug,
      title: panel.title,
      type: panel.type,
      count: panel.contacts.length,
      targetCount: panel.targetCount,
      isPublic: panel.isPublic,
      pushed: panel.pushed,
      expiresAt: panel.expiresAt,
      isOwner: req.session && String(req.session.userId) === String(panel.ownerUser),
      isAdmin: !!(req.session && req.session.isAdmin),
    });
  } catch (err) {
    res.status(400).json({ error: 'Could not load this panel.' });
  }
});

// POST /api/vcf/:slug/submit - anyone with the link can add their number + country code
router.post('/api/vcf/:slug/submit', async (req, res) => {
  try {
    const { name, countryCode, number } = req.body;
    if (!name || !countryCode || !number) {
      return res.status(400).json({ error: 'Name, country code, and number are required.' });
    }

    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    if (panel.expiresAt && new Date() > panel.expiresAt) {
      return res.status(400).json({ error: 'This panel has expired and is no longer accepting numbers.' });
    }

    panel.contacts.push({
      name: name.trim().slice(0, 60),
      countryCode: countryCode.trim().replace(/[^0-9+]/g, ''),
      number: number.trim().replace(/[^0-9]/g, '').replace(/^0+/, ''),
    });
    await panel.save();

    res.status(201).json({ success: true, count: panel.contacts.length });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not save your number.' });
  }
});

// GET /api/vcf/:slug/download - owner (their own panel) or admin (any panel) can download the .vcf
router.get('/api/vcf/:slug/download', async (req, res) => {
  try {
    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    const isOwner = req.session && String(req.session.userId) === String(panel.ownerUser);
    const isAdmin = req.session && req.session.isAdmin;
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ error: 'You do not have access to download this panel.' });
    }

    const vcf = buildVcfText(panel);
    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', `attachment; filename="${panel.slug}.vcf"`);
    res.send(vcf);
  } catch (err) {
    res.status(400).json({ error: 'Could not build the VCF file.' });
  }
});

// DELETE /api/vcf/:slug - owner of a user panel, or admin for any panel
router.delete('/api/vcf/:slug', async (req, res) => {
  try {
    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    const isOwner = req.session && String(req.session.userId) === String(panel.ownerUser);
    const isAdmin = req.session && req.session.isAdmin;
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ error: 'You do not have access to delete this panel.' });
    }

    await VcfPanel.deleteOne({ _id: panel._id });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete this panel.' });
  }
});

module.exports = router;
