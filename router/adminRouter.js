const express = require('express');
const admin = express.Router();
const adminController = require('../controller/adminController/adminController');
const userManagement = require('../controller/adminController/userManagement');
const checkAdminSession = require('../middleware/adminSession');

// will handle admin login route
admin.get('/', adminController.admin);
admin.get('/login', adminController.login);
admin.post('/login', adminController.loginPost);

// will handle admin dashboard route
admin.get('/dashboard', checkAdminSession, adminController.dashboard);
// admin.post('/dashboard', adminController.dashboardPost);

// will handle user management route
admin.get('/user-management', userManagement.users);
admin.post('/user-management', userManagement.usersPost);


// will handle admin logout route
admin.post('/logout', adminController.logout);

module.exports = admin;