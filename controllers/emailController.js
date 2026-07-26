const Email = require('../models/Email');
const { Resend } = require('resend');
const linkProcessor = require('../utils/linkProcessor');

const resend = new Resend(process.env.RESEND_API_KEY);

const emailController = {
  sendEmail: async (req, res) => {
    try {
      const { to, bcc, subject, message, html, attachments, senderName, links } = req.body;
      
      if (!to || !to.length) {
        return res.status(400).json({ error: 'Recipients are required' });
      }

      if (!senderName || senderName.trim() === '') {
        return res.status(400).json({ error: 'Sender name is required' });
      }

      let finalHtml = html;
      
      if (html && links && links.length > 0) {
        finalHtml = await linkProcessor.processLinks(html, links);
      }

      const emailData = {
        from: `${senderName.trim()} <${process.env.RESEND_FROM_EMAIL}>`,
        to: to,
        subject: subject || 'No subject',
         replyTo: req.body.replyTo || to[0],
        headers: {
          'X-Entity-Ref-ID': Math.random().toString(36).substring(7),
          'X-MSYS-API': JSON.stringify({
            bounce_address: `bounce+${Date.now()}@resend.dev`
          }),
          'Return-Path': '',
          'Sender': '',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
          'X-Mailer': 'Microsoft Outlook 16.0',
          'X-Priority': '3',
          'Importance': 'normal'
        }
      };

      if (message) {
        emailData.text = message;
      }

      if (finalHtml) {
        emailData.html = finalHtml;
      }

      if (bcc && bcc.length > 0) {
        emailData.bcc = bcc;
      }

      if (attachments && attachments.length > 0) {
        emailData.attachments = attachments.map(att => ({
          filename: att.name,
          content: att.content,
          contentType: att.type
        }));
      }

      console.log('Sending email via Resend...');
      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        console.error('Resend error:', error);
        return res.status(500).json({ error: error.message });
      }

      const totalRecipients = (to?.length || 0) + (bcc?.length || 0);

      const emailRecord = await Email.create({
        to: to,
        bcc: bcc || [],
        subject: subject,
        message: message,
        html: finalHtml,
        attachmentsCount: attachments?.length || 0,
        status: 'sent',
        resendId: data.id,
        totalRecipients: totalRecipients,
        senderName: senderName.trim()
      });

      res.json({
        success: true,
        message: `Email sent to ${totalRecipients} recipients`,
        emailId: emailRecord._id,
        resendId: data.id,
        linksProcessed: links?.length || 0
      });
    } catch (error) {
      console.error('Send email error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getStats: async (req, res) => {
    try {
      const totalSentResult = await Email.aggregate([
        { $match: { status: 'sent' } },
        { $group: { _id: null, total: { $sum: "$totalRecipients" } } }
      ]);
      const totalSent = totalSentResult.length > 0 ? totalSentResult[0].total : 0;
      
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const thisMonthResult = await Email.aggregate([
        { 
          $match: { 
            status: 'sent',
            createdAt: { $gte: firstDayOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalRecipients" } } }
      ]);
      const thisMonthSent = thisMonthResult.length > 0 ? thisMonthResult[0].total : 0;

      res.json({
        totalSent,
        thisMonthSent
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

      const emails = await Email.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('to subject status createdAt totalRecipients senderName');

      const total = await Email.countDocuments({});

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
  },

  clearStats: async (req, res) => {
    try {
      await Email.deleteMany({});
      res.json({ success: true, message: 'All email stats cleared successfully' });
    } catch (error) {
      console.error('Clear stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = emailController;