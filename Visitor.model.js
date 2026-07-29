const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    ip: { type: String, trim: true, default: '' },
    path: { type: String, trim: true, default: '' },
    userAgent: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);
