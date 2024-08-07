const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userSchema = require('../../model/userSchema');

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

// will send user signup form data to the server for verification
const signupPost = async (req, res) => {
  try {
    // getting data from user signup form
    const signupData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      // password is hashed using bcrypt
      password: await bcrypt.hash(req.body.password, 10)
    }

    const userExist = await userSchema.findOne({email: signupData.email});

    if (userExist) {
      req.flash('message', 'Email already exists. Try again');
      res.redirect('/signup');
    } else {
      
    }
  } catch (err) {
    console.error(`Error on user signup post ${err}`);
  }
};

module.exports = {
  user,
  login,
  signup,
  signupPost,
};