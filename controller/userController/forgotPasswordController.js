const bcrypt = require('bcrypt');
const generateOtp = require('../../services/generateOtp');
const userSchema = require('../../model/userSchema');
const mailSender = require('../../services/emailSender');

// will render user forgot password page 
const forgotPassword = (req, res) => {
  try {
    // remove user from session
    delete req.session.user;

    res.render('user/forgotPassword', { title: 'Forgot Password', alert: req.flash('notification') });
  } catch (err) {
    console.log('Error while rendering forgot password page', err);
  }
};

// will validate email and redirect to OTP page
const forgotPasswordPost = async (req, res) => {
  try {
    const userDetails = await userSchema.findOne({ email: req.body.email });

    if (userDetails) {
      // generates a random OTP and assigns to the variable
      const otp = generateOtp();

      req.session.otp = otp;
      req.session.email = userDetails.email;

      // will store OTP send time in session
      req.session.otpSendTime = Date.now();

      // mail will be sent to the user using nodemailer
      mailSender.sendOtpMail(userDetails.email, otp);

      res.json({ url: '/otp' });
    } else {
      res.json({ notValid: true });
    }
  } catch (err) {
    res.json({ error: true });

    console.log('Error on forgot password post', err);
  }
};

// will render change password page for user
const changePassword = (req, res) => {
  try {
    if (req.session.email) {
      res.render('user/changePassword', { title: 'Change Password', alert: req.flash('notification') });
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.log('Error while rendering change password page for user', err);
  }
};

// will update user password in the database
const changePasswordPost = async (req, res) => {
  try {
    const password = await bcrypt.hash(req.body.password, 10);

    await userSchema.updateOne({
      email: req.session.email
    }, {
      password
    }).then(() => {
      console.log('User password updated');
    }).catch(err => {
      console.log(err);
    })

    res.redirect('/login?changePassword=true');
  } catch (err) {
    console.log('Error while updating user password', err);
  }
};

module.exports = {
  forgotPassword,
  forgotPasswordPost,
  changePassword,
  changePasswordPost,
}