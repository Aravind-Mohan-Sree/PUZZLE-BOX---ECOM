const express = require('express');
const admin = express.Router();
const adminController = require('../controller/adminController/adminController');
const categoryController = require('../controller/adminController/categoryController');
const productController = require('../controller/adminController/productController');
const customerController = require('../controller/adminController/customerController');
const orderController = require('../controller/adminController/orderController');
const couponController = require('../controller/adminController/couponController');
const offerController = require('../controller/adminController/offerController');
const checkAdminSession = require('../middleware/adminSession');
const upload = require('../middleware/multer');

// will handle admin login route
admin.get('/', adminController.admin);
admin.get('/login', adminController.login);
admin.post('/login', adminController.loginPost);

// will handle admin dashboard route
admin.get('/dashboard', checkAdminSession, adminController.dashboard);
// admin.post('/dashboard', adminController.dashboardPost);

// will handle admin category route
admin.get('/categories', checkAdminSession, categoryController.category);
admin.post('/categories', checkAdminSession, categoryController.categoryPost);

// will handle admin products route
admin.get('/products', checkAdminSession, productController.product);
admin.post('/products', checkAdminSession, productController.productPost);

// will handle admin add products route
admin.get('/add-product', checkAdminSession, productController.addProduct);
admin.post('/add-product', checkAdminSession, upload.array('productImage', 3), productController.addProductPost);

// will handle admin edit products route
admin.get('/edit-product', checkAdminSession, productController.editProduct);
admin.post('/edit-product', checkAdminSession, upload.array('productImage', 3), productController.editProductPost);

// will handle admin customers route
admin.get('/customers', checkAdminSession, customerController.customer);
admin.post('/customers', checkAdminSession, customerController.customerPost);

// will handle admin orders route
admin.get('/orders', checkAdminSession, orderController.order);
admin.get('/view-order', checkAdminSession, orderController.viewOrder);
admin.post('/edit-order-status', checkAdminSession, orderController.editOrderStatus);
admin.post('/reject-return', checkAdminSession, orderController.rejectReturnOrder);

// will handle admin coupon route
admin.get('/coupons',checkAdminSession, couponController.getCoupon);
admin.post('/add-coupon',checkAdminSession, couponController.addCoupon);
admin.post('/edit-coupon',checkAdminSession, couponController.editCoupon);
admin.put('/block-coupon',checkAdminSession, couponController.blockCoupon);
admin.put('/unblock-coupon',checkAdminSession, couponController.unBlockCoupon);
admin.delete('/delete-coupon',checkAdminSession, couponController.deleteCoupon);

// will handle admin offer route
admin.get('/offers',checkAdminSession,offerController.getOffer)
admin.post('/add-offer',checkAdminSession,offerController.addOffer)
admin.post('/edit-offer',checkAdminSession,offerController.editOffer)
admin.delete('/delete-offer',checkAdminSession,offerController.deleteOffer)

// will handle admin logout route
admin.post('/logout', adminController.logout);

module.exports = admin;