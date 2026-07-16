const Mail = require('../models/Mail');
const transporter = require('../utils/emailTransporter');

const mailController = {
  sendEmail: async (req, res) => {
    try {
      const { fromName, to, bcc, subject, message, attachments, totalEmails } = req.body;

      if (!fromName || fromName.trim() === '') {
        return res.status(400).json({ error: 'Sender name is required' });
      }

      if (!to || to.trim() === '') {
        return res.status(400).json({ error: 'Recipient email is required' });
      }

      if (!subject || subject.trim() === '') {
        return res.status(400).json({ error: 'Subject is required' });
      }

      if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message body is required' });
      }

      if (!bcc || !bcc.length) {
        return res.status(400).json({ error: 'BCC recipients are required' });
      }

      const mailOptions = {
        from: `${fromName.trim()} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: to.trim(),
        bcc: bcc,
        subject: subject.trim(),
        text: message,
        html: message.replace(/\n/g, '<br>')
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map(att => ({
          filename: att.name,
          content: att.content,
          contentType: att.type
        }));
      }

      console.log('Sending email via Nodemailer...');
      
      const info = await transporter.sendMail(mailOptions);

      const mailRecord = await Mail.create({
        fromName: fromName.trim(),
        to: to.trim(),
        bcc: bcc,
        subject: subject.trim(),
        message: message,
        html: message.replace(/\n/g, '<br>'),
        attachmentsCount: attachments?.length || 0,
        status: 'sent',
        totalRecipients: bcc.length,
        sentCount: bcc.length,
        failedCount: 0,
        failedEmails: [],
        completedAt: new Date()
      });

      res.json({
        success: true,
        message: `Email sent to ${bcc.length} recipients`,
        mailId: mailRecord._id,
        messageId: info.messageId
      });
    } catch (error) {
      console.error('Send email error:', error);
      
      const mailRecord = await Mail.create({
        fromName: req.body.fromName || 'Unknown',
        to: req.body.to || '',
        bcc: req.body.bcc || [],
        subject: req.body.subject || '',
        message: req.body.message || '',
        status: 'failed',
        totalRecipients: req.body.bcc?.length || 0,
        sentCount: 0,
        failedCount: req.body.bcc?.length || 0,
        failedEmails: req.body.bcc || [],
        completedAt: new Date()
      });

      res.status(500).json({ error: error.message });
    }
  },

  sendBatch: async (req, res) => {
    try {
      const { fromName, to, bcc, subject, message, attachments } = req.body;

      if (!fromName || fromName.trim() === '') {
        return res.status(400).json({ error: 'Sender name is required' });
      }

      if (!to || to.trim() === '') {
        return res.status(400).json({ error: 'Recipient email is required' });
      }

      if (!subject || subject.trim() === '') {
        return res.status(400).json({ error: 'Subject is required' });
      }

      if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message body is required' });
      }

      if (!bcc || !bcc.length) {
        return res.status(400).json({ error: 'BCC recipients are required' });
      }

      let sentCount = 0;
      let failedCount = 0;
      const failedEmails = [];

      const batchSize = 100;
      const total = bcc.length;

      for (let i = 0; i < total; i += batchSize) {
        const batch = bcc.slice(i, i + batchSize);

        try {
          const mailOptions = {
            from: `${fromName.trim()} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to: to.trim(),
            bcc: batch,
            subject: subject.trim(),
            text: message,
            html: message.replace(/\n/g, '<br>')
          };

          if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments.map(att => ({
              filename: att.name,
              content: att.content,
              contentType: att.type
            }));
          }

          await transporter.sendMail(mailOptions);
          sentCount += batch.length;
        } catch (error) {
          console.error('Batch send error:', error);
          failedCount += batch.length;
          failedEmails.push(...batch);
        }
      }

      const mailRecord = await Mail.create({
        fromName: fromName.trim(),
        to: to.trim(),
        bcc: bcc,
        subject: subject.trim(),
        message: message,
        html: message.replace(/\n/g, '<br>'),
        attachmentsCount: attachments?.length || 0,
        status: sentCount > 0 ? 'sent' : 'failed',
        totalRecipients: bcc.length,
        sentCount: sentCount,
        failedCount: failedCount,
        failedEmails: failedEmails,
        completedAt: new Date()
      });

      res.json({
        success: true,
        message: `Email sent to ${sentCount} recipients, ${failedCount} failed`,
        mailId: mailRecord._id,
        sentCount,
        failedCount,
        failedEmails
      });
    } catch (error) {
      console.error('Batch send error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getStats: async (req, res) => {
    try {
      const totalSentResult = await Mail.aggregate([
        { $match: { status: 'sent' } },
        { $group: { _id: null, total: { $sum: "$sentCount" } } }
      ]);
      const totalSent = totalSentResult.length > 0 ? totalSentResult[0].total : 0;

      const totalFailedResult = await Mail.aggregate([
        { $match: { status: { $in: ['sent', 'failed'] } } },
        { $group: { _id: null, total: { $sum: "$failedCount" } } }
      ]);
      const totalFailed = totalFailedResult.length > 0 ? totalFailedResult[0].total : 0;

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const thisMonthSentResult = await Mail.aggregate([
        {
          $match: {
            status: 'sent',
            createdAt: { $gte: firstDayOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: "$sentCount" } } }
      ]);
      const thisMonthSent = thisMonthSentResult.length > 0 ? thisMonthSentResult[0].total : 0;

      const allTimeTotal = totalSent + totalFailed;

      res.json({
        totalSent: totalSent,
        totalFailed: totalFailed,
        thisMonthSent: thisMonthSent,
        allTimeTotal: allTimeTotal,
        successRate: allTimeTotal > 0 ? Math.round((totalSent / allTimeTotal) * 100) : 0
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const mails = await Mail.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('to subject status createdAt totalRecipients sentCount failedCount fromName');

      const total = await Mail.countDocuments({});

      res.json({
        mails,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = mailController;