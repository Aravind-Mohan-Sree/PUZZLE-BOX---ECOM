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
      res.render('./admin/login', {title: 'Admin Login', alertMessage: req.flash('errorMessage')});
    }
  } catch (err) {
    console.error(`Error while rendering admin login page ${err}`);
  }
};

const loginPost = (req, res) => {
  try {
    if (req.body.username === process.env.ADMIN_USERNAME && req.body.password === process.env.ADMIN_PASSWORD) {
      req.session.username = req.body.username;

      res.redirect('/admin/dashboard');
    } else {
      req.flash('errorMessage', 'Invalid username or password');
      res.redirect('/admin/login');
    }
  } catch (err) {
    console.error(`Error on admin login post ${err}`);
  }
};

module.exports = {
  admin,
  login,
  loginPost,
};