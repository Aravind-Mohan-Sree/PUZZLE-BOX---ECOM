const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Use true for port 465. For all other ports use false
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  }
});

function sendOtpMail(email, otp) {
  const year = new Date().getFullYear();

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: "Verification Code from Puzzle Box",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Puzzle Box Verification Code</h2>
        <p>Please use the verification code below to complete your signup:</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; color: #555; margin: 0;">${otp}</p>
        </div>
        <p>If you didn't request this, you can ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ccc;" />
        <p style="font-size: 12px; color: #999;">&copy; ${year} Puzzle Box. All rights reserved.</p>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(`Error occurred while sending mail: ${err}`);
    } else {
      console.log("Verification email sent successfully");
    }
  })
}

function sendWelcomeMail(email, customerName) {
  const year = new Date().getFullYear();

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: "Welcome to Puzzle Box!",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="color: #ff6600;">Welcome to Puzzle Box, ${customerName}!</h1>
        <p>We're thrilled to have you join our community of puzzle enthusiasts. At Puzzle Box, we offer a wide variety of puzzles to challenge your mind and provide endless fun.</p>
        <p>As a new member, you now have access to:</p>
        <ul>
          <li>Exclusive discounts on puzzles</li>
          <li>Personalized puzzle recommendations</li>
          <li>Early access to new puzzle releases</li>
          <li>Expert tips and solving strategies</li>
        </ul>
        <p>To get started, visit our <a href="https://www.puzzlebox.shop" style="color: #ff6600; text-decoration: none;">website</a> and explore our latest collections.</p>
        <hr style="border: none; border-top: 1px solid #ccc;" />
        <p style="font-size: 12px; color: #999;">&copy; ${year} Puzzle Box. All rights reserved.</p>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(`Error occurred while sending mail: ${err}`);
    } else {
      console.log("Welcome email sent successfully");
    }
  })
}

module.exports = {
  sendOtpMail,
  sendWelcomeMail
};