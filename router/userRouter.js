const express = require('express');
const user = express.Router();
const userController = require('../controller/userController/userController');
const checkUserSession = require('../middleware/userSession');

// will handle user login route
user.get('/', userController.user);
user.get('/login', userController.login);
user.post('/login', userController.loginPost);

// will handle user signup route
user.get('/signup', userController.signup);
user.post('/signup', userController.signupPost);

// will handle OTP validation routes
user.get('/otp', userController.otp);
user.post('/otp', userController.otpPost);
user.get('/resend-otp/:email', userController.resendOtp);

// will handle user home route
// user.get('/home', checkUserSession, userController.home);
// user.post('/home', checkUserSession.homePost);

module.exports = user;