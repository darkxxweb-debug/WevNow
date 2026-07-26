const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    link: {
      type: String,
      required: [true, 'Link is required'],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tool', toolSchema);
