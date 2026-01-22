const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: [{
    type: String,
    required: true
  }],
  bcc: [{
    type: String
  }],
  subject: {
    type: String,
    default: ''
  },
  message: {
    type: String
  },
  html: {
    type: String
  },
  attachmentsCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'scheduled'],
    default: 'sent'
  },
  resendId: {
    type: String
  },
  totalRecipients: {
    type: Number,
    required: true
  }
}, { timestamps: true });

emailSchema.index({ userId: 1, createdAt: -1 });
emailSchema.index({ status: 1 });

module.exports = mongoose.model('Email', emailSchema);