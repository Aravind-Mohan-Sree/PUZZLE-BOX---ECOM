const express = require('express');
const user = express.Router();
const userController = require('../controller/userController/userController');
const forgotPasswordController = require('../controller/userController/forgotPasswordController');
const homeController = require('../controller/userController/homeController');
const checkUserSession = require('../middleware/userSession');

// will handle user login route
user.get('/', userController.user);
user.get('/login', userController.login);
user.post('/login', userController.loginPost);

// will handle google auth routes
user.get('/auth/google',userController.googleAuth)
user.get('/auth/google/callback',userController.googleAuthCallback)

// will handle user signup route
user.get('/signup', userController.signup);
user.post('/signup', userController.signupPost);

// will handle user check-email route
user.post('/check-email', userController.checkEmail);

// will handle OTP routes
user.get('/otp', userController.otp);
user.get('/otp-timer', userController.otpTimer);
user.get('/check-otp/:otp', userController.checkOtp);
user.get('/resend-otp', userController.resendOtp);
user.post('/otp', userController.otpPost);

// will handle user forgot password route
user.get('/forgot-password', forgotPasswordController.forgotPassword);
user.post('/forgot-password', forgotPasswordController.forgotPasswordPost);
user.get('/change-password', forgotPasswordController.changePassword);
user.post('/change-password', forgotPasswordController.changePasswordPost);

// will handle user home route
user.get('/home', homeController.home);
// user.post('/home', checkUserSession.homePost);

// will handle user logout
user.post('/logout', userController.logout);

module.exports = user;