const mongoose = require('mongoose');

const downloadHistorySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: 'Unknown title' },
    thumbnail: { type: String, trim: true, default: '' },
    sourceUrl: { type: String, trim: true, required: true },
    audioUrl: { type: String, trim: true, default: '' },
    videoUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DownloadHistory', downloadHistorySchema);
