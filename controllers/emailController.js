const Email = require('../models/Email');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const emailController = {
  sendEmail: async (req, res) => {
    try {
      const { to, bcc, subject, message, html, attachments } = req.body;
      
      if (!to || !to.length) {
        return res.status(400).json({ error: 'Recipients are required' });
      }

      const emailData = {
        from: `${req.user.username} <${process.env.RESEND_FROM_EMAIL}>`,
        to: to,
        subject: subject || 'No subject',
        text: message || '',
      };

      if (bcc && bcc.length > 0) {
        emailData.bcc = bcc;
      }

      if (html) {
        emailData.html = html;
      }

      if (attachments && attachments.length > 0) {
        emailData.attachments = attachments.map(att => ({
          filename: att.name,
          content: att.content,
          contentType: att.type
        }));
      }

      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const emailRecord = await Email.create({
        userId: req.user.id,
        to: to,
        bcc: bcc || [],
        subject: subject,
        message: message,
        html: html,
        attachmentsCount: attachments?.length || 0,
        status: 'sent',
        resendId: data.id,
        totalRecipients: to.length + (bcc?.length || 0)
      });

      res.json({
        success: true,
        message: `Email sent to ${emailRecord.totalRecipients} recipients`,
        emailId: emailRecord._id,
        resendId: data.id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getStats: async (req, res) => {
    try {
      const totalSent = await Email.countDocuments({ status: 'sent' });
      
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthSent = await Email.countDocuments({
        status: 'sent',
        createdAt: { $gte: firstDayOfMonth }
      });

      const lastMonthFirstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      const lastMonthSent = await Email.countDocuments({
        status: 'sent',
        createdAt: { $gte: lastMonthFirstDay, $lte: lastMonthLastDay }
      });

      const increase = lastMonthSent > 0 
        ? `+${Math.round(((thisMonthSent - lastMonthSent) / lastMonthSent) * 100)}%` 
        : thisMonthSent > 0 ? '+100%' : '+0%';

      const PLAN_LIMIT = 50000;
      const remaining = Math.max(0, PLAN_LIMIT - thisMonthSent);

      const userThisMonthSent = await Email.countDocuments({
        userId: req.user.id,
        status: 'sent',
        createdAt: { $gte: firstDayOfMonth }
      });

      const userTotalSent = await Email.countDocuments({ 
        userId: req.user.id, 
        status: 'sent' 
      });

      res.json({
        totalSent,
        thisMonthSent,
        increase,
        remaining,
        userTotalSent,
        userThisMonthSent,
        plan: {
          name: 'Pro',
          limit: PLAN_LIMIT,
          usage: thisMonthSent
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const emails = await Email.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('to subject status createdAt totalRecipients');

      const total = await Email.countDocuments({ userId: req.user.id });

      res.json({
        emails,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = emailController;