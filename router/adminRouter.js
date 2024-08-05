const express = require('express');
const admin = express.Router();
const adminController = require('../controller/adminController/adminController');
const checkAdminSession = require('../middleware/adminSession');

// will handle admin login route
admin.get('/', adminController.admin);
admin.get('/login', adminController.login);
admin.post('/login', adminController.loginPost);

// will handle admin dashboard route
admin.get('/dashboard', checkAdminSession, adminController.dashboard);
// admin.post('/dashboard', adminController.dashboardPost);

module.exports = admin;