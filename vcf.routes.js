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

function ownerOrAdmin(req, panel) {
  const isOwner = !!(req.session && req.session.userId && String(req.session.userId) === String(panel.ownerUser));
  const isAdmin = !!(req.session && req.session.isAdmin);
  return { isOwner, isAdmin };
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

// POST /api/vcf - create a VCF collection panel. Any logged-in user gets the
// full set of controls: cover photo, optional target count, optional expiry,
// and public/private visibility.
router.post('/api/vcf', requireAuth, async (req, res) => {
  try {
    const { title, coverPhoto, targetCount, durationHours, isPublic } = req.body;
    if (!title) return res.status(400).json({ error: 'Panel title is required.' });

    const slug = await makeSlug();
    const hours = Number(durationHours) || 0;
    const expiresAt = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;

    const panel = await VcfPanel.create({
      slug,
      title: title.trim(),
      coverPhoto: (coverPhoto || '').trim(),
      type: 'user',
      ownerUser: req.session.userId,
      ownerUsername: req.session.username || '',
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

// GET /api/vcf/mine - panels owned by the current user
router.get('/api/vcf/mine', requireAuth, async (req, res) => {
  try {
    const panels = await VcfPanel.find({ ownerUser: req.session.userId }).sort({ createdAt: -1 });
    res.json(panels);
  } catch (err) {
    res.status(500).json({ error: 'Could not load your panels.' });
  }
});

// GET /api/vcf/explore - any public panel (user or admin created), most popular first
router.get('/api/vcf/explore', async (req, res) => {
  try {
    const panels = await VcfPanel.find({ isPublic: true }).sort({ views: -1, createdAt: -1 });

    const withCounts = panels
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        coverPhoto: p.coverPhoto,
        count: p.contacts.length,
        targetCount: p.targetCount,
        downloadEnabled: p.downloadEnabled,
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

// GET /api/vcf/:slug - minimal public metadata for the standalone submission page.
// Deliberately does not expose owner/admin controls here - the panel link is a
// dead-end submission form, not a way into the rest of the site.
router.get('/api/vcf/:slug', async (req, res) => {
  try {
    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    panel.views += 1;
    await panel.save();

    res.json({
      slug: panel.slug,
      title: panel.title,
      coverPhoto: panel.coverPhoto,
      expiresAt: panel.expiresAt,
    });
  } catch (err) {
    res.status(400).json({ error: 'Could not load this panel.' });
  }
});

// POST /api/vcf/:slug/submit - anyone with the link can add their name + number
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

// POST /api/vcf/:slug/push - owner (or admin) enables downloads for this panel.
// If a target count was set, it must be reached first.
router.post('/api/vcf/:slug/push', async (req, res) => {
  try {
    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    const { isOwner, isAdmin } = ownerOrAdmin(req, panel);
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ error: 'You do not have access to this panel.' });
    }

    if (panel.targetCount > 0 && panel.contacts.length < panel.targetCount) {
      return res.status(400).json({
        error: `Not enough numbers yet: ${panel.contacts.length}/${panel.targetCount}.`,
      });
    }

    panel.downloadEnabled = true;
    panel.downloadEnabledAt = new Date();
    await panel.save();

    res.json(panel);
  } catch (err) {
    res.status(400).json({ error: 'Could not enable downloads for this panel.' });
  }
});

// POST /api/vcf/:slug/lock - owner (or admin) turns downloads back off
router.post('/api/vcf/:slug/lock', async (req, res) => {
  try {
    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    const { isOwner, isAdmin } = ownerOrAdmin(req, panel);
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ error: 'You do not have access to this panel.' });
    }

    panel.downloadEnabled = false;
    panel.downloadEnabledAt = null;
    await panel.save();

    res.json(panel);
  } catch (err) {
    res.status(400).json({ error: 'Could not update this panel.' });
  }
});

// POST /api/vcf/:slug/visibility - owner (or admin) toggles public/private
router.post('/api/vcf/:slug/visibility', async (req, res) => {
  try {
    const { isPublic } = req.body;
    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    const { isOwner, isAdmin } = ownerOrAdmin(req, panel);
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ error: 'You do not have access to this panel.' });
    }

    panel.isPublic = !!isPublic;
    await panel.save();

    res.json(panel);
  } catch (err) {
    res.status(400).json({ error: 'Could not update this panel.' });
  }
});

// GET /api/vcf/:slug/download - owner (only once they've enabled downloads) or
// admin (always, as an oversight override) can download the .vcf file.
router.get('/api/vcf/:slug/download', async (req, res) => {
  try {
    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    const { isOwner, isAdmin } = ownerOrAdmin(req, panel);
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ error: 'You do not have access to download this panel.' });
    }
    if (isOwner && !isAdmin && !panel.downloadEnabled) {
      return res.status(403).json({ error: 'Enable downloads for this panel first.' });
    }

    const vcf = buildVcfText(panel);
    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', `attachment; filename="${panel.slug}.vcf"`);
    res.send(vcf);
  } catch (err) {
    res.status(400).json({ error: 'Could not build the VCF file.' });
  }
});

// DELETE /api/vcf/:slug - owner of a panel, or admin for any panel
router.delete('/api/vcf/:slug', async (req, res) => {
  try {
    const panel = await VcfPanel.findOne({ slug: req.params.slug });
    if (!panel) return res.status(404).json({ error: 'Panel not found.' });

    const { isOwner, isAdmin } = ownerOrAdmin(req, panel);
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
