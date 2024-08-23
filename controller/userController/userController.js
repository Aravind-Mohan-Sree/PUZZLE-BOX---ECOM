const bcrypt = require('bcrypt');
const generateOtp = require('../../services/generateOtp');
const userSchema = require('../../model/userSchema');
const mailSender = require('../../services/emailSender');
const passport = require('passport');
require('../../services/auth');

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
      if (req.query.changePassword) {
        req.flash('alert', { message: 'Password changed successfully!', color: 'bg-success' });
      }

      if (req.query.logout) {
        req.flash('alert', { message: 'Logout successful!', color: 'bg-danger' });
      }

      if (req.query.isBlocked) {
        req.flash('alert', { message: 'You are blocked by the admin!', color: 'bg-danger' });
      }

      res.render('user/login', { title: 'User Login', alert: req.flash('alert'), user: req.session.user });
    }
  } catch (err) {
    console.error(`Error while rendering user login page ${err}`);
  }
};

// will send user login details to the server
const loginPost = async (req, res) => {
  try {
    const userDetails = await userSchema.findOne({ email: req.body.email });

    if (!userDetails || userDetails.isBlocked) {
      if (!userDetails) {
        res.json({ wrongEmail: true });
      } else {      
        res.json({ isBlocked: true });
      }
    } else {
      const validPassword = await bcrypt.compare(req.body.password, userDetails.password);

      if (validPassword) {
        req.session.user = userDetails._id;

        res.json({ url: '/home?login=true' });
      } else {
        res.json({ wrongPassword: true });
      }
    }
  } catch (err) {
    res.json({ error: true });

    console.log('Error in user login post', err);
  }
};

// will render user signup page if user session is not present
const signup = (req, res) => {
  try {
    if (req.session.user) {
      res.redirect('/home');
    } else {
      res.render('user/signup', { title: 'User Signup', alert: req.flash('alert'), user: req.session.user });
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
    console.error('Error in user signup post', err);
  }
};

// will check if the email already exist in database
const checkEmail = async (req, res) => {
  try {
    const emailExist = await userSchema.findOne({ email: req.body.email });

    if (emailExist) {
      res.json({ exist: true });
    } else {
      res.json({ exist: false });
    }
  } catch (err) {
    res.json({ error: true });

    console.error('Error while validating email', err);
  }
};

// will render OTP page if OTP remains in session
const otp = (req, res) => {
  try {
    if (req.session.otp) {
      res.render('user/otp', { title: 'Verify OTP', alert: req.flash('alert'), user: req.session.user });
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Error on rendering user OTP page', err);
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
    res.json({ error: true });

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
    res.json({ error: true });

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

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });

    console.error('Error in resending OTP', err);
  }
};

// will redirect to home page and store user details in database
const otpPost = async (req, res) => {
  try {
    // will delete OTP stored in session
    delete req.session.otp;

    if (req.session.name) {
      await userSchema.create({
        name: req.session.name,
        phone: req.session.phone,
        email: req.session.email,
        password: req.session.password
      }).then(() => {
        console.log('User details saved into database');
      }).catch(err => {
        console.log(err);
      })

      const userDetails = await userSchema.findOne({ email: req.session.email });

      // mail will be sent to the user using nodemailer
      mailSender.sendWelcomeMail(userDetails.email, userDetails.name);

      delete req.session.name;
      delete req.session.phone;
      delete req.session.email;
      delete req.session.password;

      // creating user session
      req.session.user = userDetails._id;

      res.redirect('/home?login=true');
    } else {
      res.redirect('/change-password');
    }
  } catch (err) {
    console.log('Error in OTP post request', err);
  }
};

// google auth 
const googleAuth = (req, res) => {
  try {
    passport.authenticate('google', {
      scope:
        ['email', 'profile']
    })(req, res)
  } catch (err) {
    console.log(`Error on google authentication ${err}`)
  }
}

// google auth callback from the auth service
const googleAuthCallback = (req, res, next) => {
  try {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.log(`Error on google auth callback: ${err}`);
        return next(err);
      }

      if (!user) {
        return res.redirect('/login');
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        // Store the user ID in the session
        req.session.user = user.id;

        return res.redirect('/home?login=true');
      });
    })(req, res, next);
  } catch (err) {
    console.log(`Error on google callback ${err}`);
  }
}

// will destroy the session and logout user
const logout = (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/login?logout=true');
      }
    });
  } catch (err) {
    console.log('Error on user logout', err);
  }
};

module.exports = {
  user,
  login,
  loginPost,
  signup,
  signupPost,
  checkEmail,
  otp,
  otpTimer,
  checkOtp,
  resendOtp,
  otpPost,
  googleAuth,
  googleAuthCallback,
  logout
};