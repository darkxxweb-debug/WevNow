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

// ---------- Instagram / Facebook / TikTok downloaders ----------

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`Upstream error: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

// GET /api/download/ig?url=...
router.get('/api/download/ig', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Please provide an Instagram link.' });

  try {
    const data = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`);
    const list = data.data || data.result || data.results || [];
    const medias = (Array.isArray(list) ? list : [list]).map((item) => ({
      url: item.url || item.download_url || item.link || '',
      type: (item.type || item.resolution || '').toLowerCase().includes('image') ? 'image' : 'video',
      thumbnail: item.thumbnail || item.thumb || '',
    })).filter((m) => m.url);

    if (!medias.length) return res.status(422).json({ error: 'No downloadable media found for this link.' });

    DownloadHistory.create({
      title: 'Instagram media',
      thumbnail: medias[0].thumbnail || '',
      sourceUrl: url,
      videoUrl: medias.find((m) => m.type === 'video')?.url || '',
      audioUrl: '',
    }).catch(() => {});

    res.json({ medias });
  } catch (err) {
    console.error('IG download error:', err.message);
    res.status(500).json({ error: 'Could not fetch this Instagram link. Try again.' });
  }
});

// GET /api/download/fb?url=...
router.get('/api/download/fb', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Please provide a Facebook link.' });

  try {
    const data = await fetchJson(`https://movanest.xyz/v2/fbdown?url=${encodeURIComponent(url)}`);
    const result = data.data || data.result || data;
    const hd = result.hd || result.HD || result.high || '';
    const sd = result.sd || result.SD || result.low || result.normal || '';

    if (!hd && !sd) return res.status(422).json({ error: 'No downloadable video found for this link.' });

    DownloadHistory.create({
      title: result.title || 'Facebook video',
      thumbnail: result.thumbnail || '',
      sourceUrl: url,
      videoUrl: hd || sd,
      audioUrl: '',
    }).catch(() => {});

    res.json({ hd, sd, title: result.title || 'Facebook video', thumbnail: result.thumbnail || '' });
  } catch (err) {
    console.error('FB download error:', err.message);
    res.status(500).json({ error: 'Could not fetch this Facebook link. Try again.' });
  }
});

// GET /api/download/tiktok?url=...
router.get('/api/download/tiktok', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Please provide a TikTok link.' });

  try {
    const data = await fetchJson(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const result = data.data;
    if (!result) return res.status(422).json({ error: 'No downloadable video found for this link.' });

    const videoUrl = result.play ? `https://www.tikwm.com${result.play}` : (result.hdplay ? `https://www.tikwm.com${result.hdplay}` : '');
    const audioUrl = result.music ? (result.music.startsWith('http') ? result.music : `https://www.tikwm.com${result.music}`) : '';

    DownloadHistory.create({
      title: result.title || 'TikTok video',
      thumbnail: result.cover || '',
      sourceUrl: url,
      videoUrl,
      audioUrl,
    }).catch(() => {});

    res.json({
      title: result.title || 'TikTok video',
      thumbnail: result.cover || '',
      video: videoUrl,
      audio: audioUrl,
    });
  } catch (err) {
    console.error('TikTok download error:', err.message);
    res.status(500).json({ error: 'Could not fetch this TikTok link. Try again.' });
  }
});

module.exports = router;
