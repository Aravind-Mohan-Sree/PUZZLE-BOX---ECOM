const express = require('express');
const admin = express.Router();
const adminController = require('../controller/adminController/adminController');
const categoryController = require('../controller/adminController/categoryController');
const productController = require('../controller/adminController/productController');
const customerController = require('../controller/adminController/customerController');
const checkAdminSession = require('../middleware/adminSession');
const upload = require('../middleware/multer');

// will handle admin login route
admin.get('/', adminController.admin);
admin.get('/login', adminController.login);
admin.post('/login', adminController.loginPost);

// will handle admin dashboard route
admin.get('/dashboard', adminController.dashboard);
// admin.post('/dashboard', adminController.dashboardPost);

// will handle admin category route
admin.get('/categories', categoryController.category);
admin.post('/categories', categoryController.categoryPost);

// will handle admin products route
admin.get('/products', productController.product);
admin.post('/products', productController.productPost);

// will handle admin add products route
admin.get('/add-product', productController.addProduct);
admin.post('/add-product', upload.array('productImage', 3), productController.addProductPost);

// will handle admin edit products route
admin.get('/edit-product', productController.editProduct);
admin.post('/edit-product', upload.array('productImage', 3), productController.editProductPost);

// will handle admin customers route
admin.get('/customers', customerController.customer);
admin.post('/customers', customerController.customerPost);

// will handle admin logout route
admin.post('/logout', adminController.logout);

module.exports = admin;