require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('🔍 Testing SMTP Connection...');
  console.log(`📡 Host: ${process.env.SMTP_HOST}`);
  console.log(`🔑 Port: ${process.env.SMTP_PORT}`);
  console.log(`👤 User: ${process.env.SMTP_USER}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP Connection Successful!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"MailMaster Pro" <${process.env.SMTP_FROM_EMAIL}>`,
      to: 'your-test-email@gmail.com', // Change this to test
      subject: 'SMTP Test from MailMaster Pro',
      text: 'This is a test email from your CyberPanel SMTP server!',
      html: '<h1>SMTP Test</h1><p>This is a test email from your CyberPanel SMTP server!</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Test Failed:', error.message);
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Make sure your CyberPanel SMTP server is running');
    console.log('2. Check if the domain bidtinder.com resolves correctly');
    console.log('3. Try different ports: 25, 587, or 465');
    console.log('4. Check firewall settings on your server');
    console.log('5. Verify the password is correct');
  }
}

testSMTP();