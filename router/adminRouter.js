const express = require('express');
const admin = express.Router();
const adminController = require('../controller/adminController/adminController');
const categoryController = require('../controller/adminController/categoryController');
const productController = require('../controller/adminController/productController');
const customerController = require('../controller/adminController/customerController');
const checkAdminSession = require('../middleware/adminSession');

// will handle admin login route
admin.get('/', adminController.admin);
admin.get('/login', adminController.login);
admin.post('/login', adminController.loginPost);

// will handle admin dashboard route
admin.get('/dashboard', checkAdminSession, adminController.dashboard);
// admin.post('/dashboard', adminController.dashboardPost);

// will handle admin category route
admin.get('/categories', categoryController.category);
admin.post('/categories', categoryController.categoryPost);

// will handle admin products route
admin.get('/products', productController.product);
// admin.post('/products', productController.productPost);
admin.get('/add-product', productController.addProduct);

// will handle admin customers route
admin.get('/customers', customerController.customer);
admin.post('/customers', customerController.customerPost);

// will handle admin logout route
admin.post('/logout', adminController.logout);

module.exports = admin;