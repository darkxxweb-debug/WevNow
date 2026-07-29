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
        validator: (v) => /^https:\/\/chat\.whatsapp\.com\/\S+$/i.test(v),
        message: 'Link must start with https://chat.whatsapp.com/',
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
