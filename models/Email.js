const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
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
  },
  senderName: {
    type: String,
    required: true
  }
}, { timestamps: true });

emailSchema.index({ createdAt: -1 });
emailSchema.index({ status: 1 });

module.exports = mongoose.model('Email', emailSchema);