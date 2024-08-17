const bcrypt = require('bcrypt');
const generateOtp = require('../../services/generateOtp');
const userSchema = require('../../model/userSchema');
const mailSender = require('../../services/emailSender');

// will render user forgot password page 
const forgotPassword = (req, res) => {
  try {
    // remove user from session
    delete req.session.user;

    res.render('user/forgotPassword', { title: 'Forgot Password' });
  } catch (err) {
    console.log('Error while rendering forgot password page', err);
  }
};

// will validate email and redirect to OTP page
const forgotPasswordPost = async (req, res) => {
  try {
    const emailExist = await userSchema.findOne({ email: req.body.email });

    if (emailExist) {
      // generates a random OTP and assigns to the variable
      const otp = generateOtp();

      req.session.otp = otp;
      req.session.email = emailExist.email;

      // will store OTP send time in session
      req.session.otpSendTime = Date.now();

      // mail will be sent to the user using nodemailer
      mailSender.sendOtpMail(emailExist.email, otp);

      res.redirect('/otp');
    } else {
      res.json({ notValid: true });
    }
  } catch (err) {
    res.json({ error: true });

    console.log('Error on forgot password post', err);
  }
};

module.exports = {
  forgotPassword,
  forgotPasswordPost,
}