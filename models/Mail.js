const mongoose = require('mongoose');

const mailSchema = new mongoose.Schema({
  fromName: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
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
    enum: ['sent', 'failed', 'aborted', 'scheduled'],
    default: 'sent'
  },
  totalRecipients: {
    type: Number,
    required: true
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  failedEmails: [{
    type: String
  }],
  completedAt: {
    type: Date
  }
}, { timestamps: true });

mailSchema.index({ createdAt: -1 });
mailSchema.index({ status: 1 });

module.exports = mongoose.model('Mail', mailSchema);