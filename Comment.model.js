const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tool',
      required: true,
    },
    username: {
      type: String,
      trim: true,
      required: true,
    },
    text: {
      type: String,
      trim: true,
      required: [true, 'Comment text is required'],
      maxlength: 300,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
