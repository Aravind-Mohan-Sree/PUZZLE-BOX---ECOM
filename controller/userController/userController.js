const mongoose = require('mongoose');
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
    if (req.session.user) {
      res.redirect('/home');
    } else {
      res.render('./user/login', { title: 'User Login' });
    }
  } catch (err) {
    console.error(`Error while rendering user login page ${err}`);
  }
};

// will render user signup page if user session is not present
const signup = (req, res) => {
  try {
    if (req.session.user) {
      res.redirect('/home');
    } else {
      res.render('./user/signup', { title: 'User Signup' });
    }
  } catch (err) {
    console.error(`Error while rendering user signup page ${err}`);
  }
};

// user login with username and password
const loginPost = async (req, res) => {
  try {
    // the username is the email address of the user 
    // find the user with entered email address in user collection
    console.log(req.body);
    const checkUser = await userSchema.findOne({ email: req.body.email })
    if (checkUser != null) {
      if (checkUser.isBlocked) {
        req.flash('errorMessage', 'Access to this account has been restricted. Please reach out to the administrator for further assistance and guidance on the next steps.')
        res.redirect('/login')
      } else {
        // check the entered password in login form and data stored in user collection is same
        const mongoPassword = await bcrypt.compare(req.body.password, checkUser.password)

        // if the user entered password and password in the collection is same then redirect to home page with session
        if (checkUser && mongoPassword) {
          req.session.user = checkUser.id //user section is created
          res.redirect('/home')
        } else {
          req.flash("errorMessage", "Invalid username or password")
          res.redirect('/login')
        }
      }
    } else {
      req.flash("errorMessage", `We couldn't find your user details. Please proceed with registration to access our services.`)
      res.redirect('/login')
    }
  } catch (err) {
    console.log(`Error while login ${err}`);
  }
};

// will send user signup form data to the server for verification
const signupPost = async (req, res) => {
  try {
    // getting data from user signup form
    const signupData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      // password is hashed using bcrypt
      password: await bcrypt.hash(req.body.password, 10)
    }

    const userExist = await userSchema.findOne({ email: signupData.email });

    if (userExist) {
      req.flash('message', 'Email already exists. Try again');
      res.redirect('/signup');
    } else {
      // will generate a random OTP
      const otp = generateOtp();

      // will send OTP to the mail ID of user
      mailSender.sendOtpMail(req.body.email, otp);
      req.flash('message', `OTP successfully send to '${req.body.email}'`);

      // storing OTP and OTP expiry in session
      req.session.otp = otp;
      req.session.otpExpireTime = Date.now();

      // storing user data in session
      req.session.name = signupData.name;
      req.session.email = signupData.email;
      req.session.phone = signupData.phone;
      req.session.password = signupData.password;

      // will redirect to OTP validation page
      res.redirect('/otp');
    }
  } catch (err) {
    console.error(`Error on user signup post ${err}`);
  }
};

// will render OTP validation page after email verification
const otp = (req, res) => {
  try {
    res.render('./user/otp', { title: "OTP Validation", emailAddress: req.session.email, alertMessage: req.flash('errorMessage'), otpExpireTime: req.session.otpExpireTime, /*user: req.session.user*/ })
  } catch (err) {
    console.log(`Error occurred during otp verification ${err}`)
  }
};

const otpPost = async (req, res) => {
  try {
    // if otp is in the session then continue with checking
    if (req.session.otp !== undefined) {

      // if the user entered otp and otp in session is equal then only the user's data is stored in users collection
      if (req.session.otp === req.body.otp) {
        // adding the user data to mongodb with collection name user
        const newUser = new userSchema({
          name: req.session.name,
          phone: req.session.phone,
          password: req.session.password,
          email: req.session.email
        })

        await newUser.save()
        mailSender.sendWelcomeMail(req.session.email, req.session.name)
        req.flash('errorMessage', 'user registration successful');
        req.session.user = newUser.id
        res.redirect('/home')

      } else {
        req.flash('errorMessage', 'It appears the OTP you entered is invalid. Please ensure you enter the OTP correctly.')
        res.redirect('/Otp')
      }


      // if otp is not in the session an alert message is displayed
    } else {
      req.flash('errorMessage', 'An error occurred during OTP generation, please kindly retry.')
      res.redirect('/signup')
    }
  } catch (err) {
    console.log(`Error occurred while verifying OTP ${err}`)
  }
};

// will resend otp using fetch 
const resendOtp = (req, res) => {
  try {
    const email = req.params.email;

    // will generate a random OTP
    const otp = generateOtp();

    // will send OTP to the mail ID of user
    mailSender.sendOtpMail(email, otp)

    // storing OTP and OTP expiry in session
    req.session.otp = otp;
    req.session.otpExpireTime = Date.now();

    res.status(200);

    // will redirect to OTP validation page
    // req.flash('errorMessage', "OTP re-sended successfully")
    res.redirect('/otp')
  } catch (err) {
    console.log(`Error during OTP resending ${err}`);
  }
};

module.exports = {
  user,
  login,
  loginPost,
  signup,
  signupPost,
  otp,
  otpPost,
  resendOtp,
};