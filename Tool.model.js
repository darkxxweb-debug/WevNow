const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    coverPhoto: {
      type: String,
      trim: true,
      default: '',
    },
    previewLinks: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 8,
        message: 'You can add up to 8 preview links only.',
      },
    },
    downloadLink: {
      type: String,
      required: [true, 'Download link is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Other',
      maxlength: 40,
    },
    size: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    ownerNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ownerUsername: {
      type: String,
      trim: true,
      default: '',
    },
    downloads: {
      type: Number,
      default: 0,
    },
    ratingSum: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tool', toolSchema);
