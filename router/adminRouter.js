const express = require('express');
const admin = express.Router();
const adminController = require('../controller/adminController/adminController');

// will handle login route
admin.get('/', adminController.admin);
admin.get('/login', adminController.login);
admin.post('/login', adminController.loginPost);

module.exports = admin;