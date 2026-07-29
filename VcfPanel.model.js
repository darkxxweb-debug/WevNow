const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    countryCode: { type: String, trim: true, required: true, maxlength: 6 },
    number: { type: String, trim: true, required: true, maxlength: 20 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const vcfPanelSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
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
    contacts: {
      type: [contactSchema],
      default: [],
    },
    targetCount: {
      type: Number,
      default: 0, // 0 = no target (user panels)
    },
    durationHours: {
      type: Number,
      default: 0, // 0 = no expiry
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: false, // only admin panels can be made public / explored
    },
    pushed: {
      type: Boolean,
      default: false,
    },
    pushedAt: {
      type: Date,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VcfPanel', vcfPanelSchema);
