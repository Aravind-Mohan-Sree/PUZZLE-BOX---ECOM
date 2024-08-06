const mongoose = require('mongoose');

// will redirect to user login page
const user = (req, res) => {
  res.redirect('/login');
};

// will render user login page if user session is not present
const login = (req, res) => {
  try {
    if (req.session.user) {
      res.redirect('/home');
    } else {
      res.render('./user/login', {title: 'User Login'});
    }
  } catch (err) {
    console.error(`Error while rendering user login page ${err}`);
  }
};

// will render user signup page if user session is not present
const signup = (req, res) => {
  try {
    if (req.session.user) {
      res.redirect('/home');
    } else {
      res.render('./user/signup', {title: 'User Signup'});
    }
  } catch (err) {
    console.error(`Error while rendering user signup page ${err}`);
  }
};

module.exports = {
  user,
  login,
  signup,
};