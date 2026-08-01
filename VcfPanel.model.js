const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '', maxlength: 60 },
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
    coverPhoto: {
      type: String,
      trim: true,
      default: '',
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
      default: 0, // 0 = no target
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
      default: false, // shown on /vcf/explore when true
    },
    // The owner must explicitly enable this before the .vcf file can be
    // downloaded (by anyone, including the owner). Admins can always
    // download regardless of this flag.
    downloadEnabled: {
      type: Boolean,
      default: false,
    },
    downloadEnabledAt: {
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
