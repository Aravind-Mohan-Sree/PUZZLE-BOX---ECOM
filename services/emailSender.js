const nodemailer = require('nodemailer');

// creates a transporter which is used to send emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// will sent a OTP to the recipient email
const sendOtpMail = async (email, otp) => {
  const mailOptions = {
    from: 'puzzleboxlimited@gmail.com',
    to: email,
    subject: 'OTP from PUZZLEBOX',
    html: `<p>Dear Puzzler,</p>
           <p style="margin-top: 1.3rem; margin-bottom: 1.3rem;">Your PUZZLE BOX One Time Password (OTP) is <strong>${otp}</strong>. Don't share it with anyone. OTP is valid for 2 mins.</p>
           <p style="margin-bottom: 1.3rem;">Thanks & Regards<br>PUZZLE BOX Team</p>
           <p>This is an automatically generated email. Please do not reply to this email.</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);     

    console.log('OTP Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};

// Function to send a welcome email
const sendWelcomeMail = async (recipientEmail, userName) => {
  const mailOptions = {
    from: 'your-email@example.com',
    to: recipientEmail,
    subject: 'Welcome to Our Service!',
    text: `Hi ${userName},\n\nWelcome to our service! We're excited to have you on board.\n\nBest regards,\nThe Team`,
    html: `<p>Hi <strong>${userName}</strong>,</p><p>Welcome to our service! We're excited to have you on board.</p><p>Best regards,<br>The Team</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    req.session.otpSendTime = Date.now();

    console.log('Welcome Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

module.exports = {sendOtpMail, sendWelcomeMail};