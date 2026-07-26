const express = require('express');
const router = express.Router();
const DownloadHistory = require('./DownloadHistory.model');

const YT_EXTRACT_ENDPOINT = 'https://yt-dl.officialhectormanuel.workers.dev/?url=';

function extractYouTubeUrl(raw) {
  if (!raw) return null;
  const pattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = raw.match(pattern);
  if (match && match[1]) return `https://www.youtube.com/watch?v=${match[1]}`;
  if (raw.includes('youtube.com') || raw.includes('youtu.be')) return raw;
  return null;
}

function pickBestFormats(data) {
  const formats = Array.isArray(data.formats) ? data.formats : [];
  const videoFormats = formats.filter((f) => f.type === 'video' || f.hasVideo);
  const audioFormats = formats.filter((f) => f.type === 'audio' || f.hasAudio);

  const bestVideo = videoFormats.length
    ? videoFormats.reduce((a, b) => ((a.height || 0) >= (b.height || 0) ? a : b))
    : null;
  const bestAudio = audioFormats.length
    ? audioFormats.reduce((a, b) => ((a.bitrate || 0) >= (b.bitrate || 0) ? a : b))
    : null;

  return { bestVideo, bestAudio };
}

// GET /api/download?url=...
router.get('/api/download', async (req, res) => {
  const rawUrl = req.query.url;
  const cleanUrl = extractYouTubeUrl(rawUrl);

  if (!cleanUrl) {
    return res.status(400).json({ error: 'Please provide a valid YouTube link.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const response = await fetch(`${YT_EXTRACT_ENDPOINT}${encodeURIComponent(cleanUrl)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Upstream error: ${response.status}`);

    const data = await response.json();
    if (data.status === false || data.error) {
      throw new Error(data.message || data.error || 'Video not accessible.');
    }

    const title = data.title || data.video_title || 'Untitled track';
    const thumbnail = data.thumbnail || data.thumb || data.image || '';
    const { bestVideo, bestAudio } = pickBestFormats(data);

    if (!bestVideo && !bestAudio) {
      return res.status(422).json({ error: 'No downloadable formats found for this link.' });
    }

    // Save to history, but don't block the response on it
    DownloadHistory.create({
      title,
      thumbnail,
      sourceUrl: cleanUrl,
      audioUrl: bestAudio ? bestAudio.url : '',
      videoUrl: bestVideo ? bestVideo.url : '',
    }).catch((err) => console.error('History save failed:', err.message));

    res.json({
      title,
      thumbnail,
      audio: bestAudio,
      video: bestVideo,
    });
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: err.message || 'Something went wrong. Try again.' });
  }
});

// GET /api/history - latest downloads
router.get('/api/history', async (req, res) => {
  try {
    const items = await DownloadHistory.find().sort({ createdAt: -1 }).limit(30);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Could not load history.' });
  }
});

module.exports = router;
