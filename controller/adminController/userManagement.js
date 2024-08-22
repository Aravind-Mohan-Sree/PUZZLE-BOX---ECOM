const mongoose = require('mongoose');
const userSchema = require('../../model/userSchema');

// will render users list
const users = async (req, res) => {
  try {
    const users = await userSchema.find();

    res.render('admin/user', {title: 'User Management', alert: req.flash('alert'), users});
  } catch (err) {
    console.log('Error while rendering users list', err);
  }
};

module.exports = {
  users,
};