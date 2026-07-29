const mongoose = require('mongoose');

const whatsappGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: 100,
    },
    link: {
      type: String,
      required: [true, 'Group link is required'],
      trim: true,
      validate: {
        validator: (v) => /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(v),
        message: 'Link must look like https://chat.whatsapp.com/xxxxxxxx',
      },
    },
    clicks: {
      type: Number,
      default: 0,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    addedByUsername: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WhatsappGroup', whatsappGroupSchema);
