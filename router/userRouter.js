const express = require('express');
const user = express.Router();
const userController = require('../controller/userController/userController');
const forgotPasswordController = require('../controller/userController/forgotPasswordController');
const homeController = require('../controller/userController/homeController');
const productController = require('../controller/userController/productController');
const profileController = require('../controller/userController/profileController');
const cartController = require('../controller/userController/cartController');
const wishlistController = require('../controller/userController/wishlistController');
const checkoutController = require('../controller/userController/checkoutController');
const orderController = require('../controller/userController/orderController');
const updateNavbarController = require('../controller/userController/updateNavbarController');
const testimonialController = require('../controller/userController/testimonialController');
const checkUserSession = require('../middleware/userSession');
const checkUserBlocked = require('../middleware/checkUserBlocked');

// will handle user login route
user.get('/', userController.user);
user.get('/login', userController.login);
user.post('/login', userController.loginPost);

// will handle google auth routes
user.get('/auth/google', userController.googleAuth)
user.get('/auth/google/callback', userController.googleAuthCallback)

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
user.get('/home', checkUserBlocked, homeController.home);

// will handle user product route
user.get('/products', checkUserBlocked, productController.product);
// user.post('/products', productController.productPost);

// will handle user product detail route
user.get('/product-details', checkUserBlocked, productController.productDetail);
// user.post('/product-details', productController.productDetail);

// will handle user profile route
user.get('/profile', checkUserSession, profileController.profile);
user.post('/profile', checkUserSession, profileController.profilePost);
user.post('/add-address', checkUserSession, profileController.addAddress);
user.post('/update-address', checkUserSession, profileController.updateAddress);
user.get('/delete-address', checkUserSession, profileController.deleteAddress);
user.post('/update-password', checkUserSession, profileController.updatePassword);

// will handle user cart route
user.get('/cart', checkUserSession, cartController.cart);
user.post('/add-to-cart', checkUserSession, cartController.addToCartPost);
user.delete('/remove-cart-item/:productID', checkUserSession, cartController.removeCartItem);
user.put('/increment-product/:productID', checkUserSession, cartController.increaseProductQuantity);
user.put('/decrement-product/:productID', checkUserSession, cartController.decreaseProductQuantity);

// will handle user wishlist route
user.get('/wishlist', checkUserSession, wishlistController.getWishlist);
user.post('/add-to-wishlist', checkUserSession, wishlistController.addToWishlist);
user.delete('/remove-from-wishlist', checkUserSession, wishlistController.removeFromWishlist);

// will handle user checkout route
user.get('/checkout', checkUserSession, checkoutController.checkout);
user.post('/place-order', checkUserSession, checkoutController.orderPlacement);
user.get('/order-confirmation', checkUserSession, checkoutController.orderConfirmation);

// will handle the user order route
user.get('/orders', checkUserSession, orderController.order);
user.post('/cancel-order',checkUserSession,orderController.cancelOrderPost);
user.post('/return-order', checkUserSession, orderController.returnOrderPost);
user.post('/add-review',checkUserSession,orderController.addReview);

// will handle update navbar route
user.post('/update-navbar', updateNavbarController.updateNavbarPost);

// will handle update testimonial route
user.post('/update-testimonial', testimonialController.updateTestimonialPost);

// will handle user logout
user.post('/logout', userController.logout);

module.exports = user;