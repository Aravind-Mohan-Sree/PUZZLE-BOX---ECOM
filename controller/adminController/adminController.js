const mongoose = require('mongoose');

// will redirect to admin login page
const admin = (req, res) => {
  res.redirect('/admin/login');
};

// will render admin login page if admin session is not present
const login = (req, res) => {
  try {
    if (req.session.admin) {
      res.redirect('/admin/dashboard');
    } else {
      res.render('./admin/login', {title: 'Admin Login', alertMessage: req.flash('message')});
    }
  } catch (err) {
    console.error(`Error while rendering admin login page ${err}`);
  }
};

// will send login post data to the server
const loginPost = (req, res) => {
  try {
    if (req.body.username === process.env.ADMIN_USERNAME && req.body.password === process.env.ADMIN_PASSWORD) {
      req.session.admin = req.body.username;

      req.flash('message', {color: 'green', content: 'Login Successful'});
      res.redirect('/admin/dashboard');
    } else {
      req.flash('message', {color: 'red', content: 'Invalid username or password'});
      res.redirect('/admin/login');
    }
  } catch (err) {
    console.error(`Error on admin login post ${err}`);
  }
};

// will render admin dashboard page if admin session is present
const dashboard = (req, res) => {
  try {
    res.render('./admin/dashboard', {title: 'Admin Dashboard', alertMessage: req.flash('message')});
  } catch (err) {
    console.error(`Error while rendering admin dashboard page ${err}`);
  }
};

module.exports = {
  admin,
  login,
  loginPost,
  dashboard,
};