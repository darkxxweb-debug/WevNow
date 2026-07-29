const express = require('express');
const router = express.Router();
const User = require('./User.model');

// GET /api/leaderboard - users ranked by how many people they referred, most on top
router.get('/api/leaderboard', async (req, res) => {
  try {
    const rows = await User.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'referredBy',
          as: 'referrals',
        },
      },
      {
        $project: {
          username: 1,
          referralCode: 1,
          createdAt: 1,
          referralCount: { $size: '$referrals' },
        },
      },
      { $match: { referralCount: { $gt: 0 } } },
      { $sort: { referralCount: -1, createdAt: 1 } },
      { $limit: 50 },
    ]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not load the leaderboard.' });
  }
});

module.exports = router;
