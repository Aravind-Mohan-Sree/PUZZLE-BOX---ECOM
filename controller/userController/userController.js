const bcrypt = require('bcrypt');
const generateOtp = require('../../services/generateOtp');
const userSchema = require('../../model/userSchema');
const mailSender = require('../../services/emailSender');

// will redirect to user login page
const user = (req, res) => {
  res.redirect('/login');
};

// will render user login page if user session is not present
const login = (req, res) => {
  try {
    // will delete OTP stored in session
    delete req.session.otp;

    if (req.session.user) {
      res.redirect('/home');
    } else {
      res.render('user/login', { title: 'User Login' });
    }
  } catch (err) {
    console.error(`Error while rendering user login page ${err}`);
  }
};

// will render user signup page if user session is not present
const signup = (req, res) => {
  try {
    // will delete OTP stored in session
    delete req.session.otp;

    if (req.session.user) {
      res.redirect('/home');
    } else {
      res.render('user/signup', { title: 'User Signup' });
    }
  } catch (err) {
    console.error(`Error while rendering user signup page ${err}`);
  }
};

// will send user signup details to the server
const signupPost = async (req, res) => {
  try {
    const userDetails = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      password: req.body.password
    };

    req.session.name = userDetails.name;
    req.session.phone = userDetails.phone;
    req.session.email = userDetails.email;
    req.session.password = await bcrypt.hash(userDetails.password, 10);

    // generates a random OTP and assigns to the variable
    const otp = generateOtp();

    req.session.otp = otp;

    // will store OTP send time in session
    req.session.otpSendTime = Date.now();

    // mail will be sent to the user using nodemailer
    mailSender.sendOtpMail(userDetails.email, otp);

    res.redirect('/otp');
  } catch (err) {
    console.error('Error while sending details to the server', err);
  }
};

// will check if the email already exist in database
const checkEmail = async (req, res) => {
  try {
    const emailExist = await userSchema.findOne({ email: req.params.email });

    if (emailExist) {
      res.json({ exist: true });
    } else {
      res.json({ exist: false });
    }
  } catch (err) {
    res.json({error: true});

    console.error('Error while validating email', err);
  }
};

// will render OTP page if OTP remains in session
const otp = (req, res) => {
  try {
    if (req.session.otp) {
      res.render('user/otp', { title: 'OTP Page' });
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Error on rendering OTP page', err);
  }
};

// will delete OTP from the session if expired
const otpTimer = (req, res) => {
  try {
    const timeDifference = Number(req.query.currentTime) - req.session.otpSendTime;

    if (timeDifference >= req.query.expiryTime || req.query.time < 0) {
      delete req.session.otp;
      res.json({ timeDifference });
    } else {
      res.json({ timeDifference });
    }
  } catch (err) {
    res.json({error: true});

    console.log('Error on OTP timer', err);
  }
};

// will check if the entered OTP is valid
const checkOtp = (req, res) => {
  try {
    if (req.session.otp) {
      if (req.session.otp === req.params.otp) {
        res.json({ valid: true });
      } else {
        res.json({ valid: false });
      }
    } else {
      res.json({ otpExpired: true });
    }
  } catch (err) {
    res.json({error: true});

    console.error('Error while validating OTP', err);
  }
};

// will resend OTP if user opt to do so
const resendOtp = (req, res) => {
  try {
    // generates a random OTP and assigns to the variable
    const otp = generateOtp();

    req.session.otp = otp;

    // will store OTP send time in session
    req.session.otpSendTime = Date.now();

    // mail will be sent to the user using nodemailer
    mailSender.sendOtpMail(req.session.email, otp);

    res.json({success: true});  
  } catch (err) {
    res.json({success: false});

    console.error('Error in resending OTP', err);
  }
};

// will redirect to home page and store user details in database
const otpPost = (req, res) => {
  try {
    delete req.session.otp;

    
  } catch (err) {
    console.log('Error in OTP post request', err);
  }
};

module.exports = {
  user,
  login,
  signup,
  signupPost,
  checkEmail,
  otp,
  otpTimer,
  checkOtp,
  resendOtp,
};