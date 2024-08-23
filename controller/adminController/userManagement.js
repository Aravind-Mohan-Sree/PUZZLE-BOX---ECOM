const mongoose = require('mongoose');
const userSchema = require('../../model/userSchema');

// will render users list
const users = async (req, res) => {
  try {
    const users = await userSchema.find();

    res.render('admin/user', { title: 'User Management', alert: req.flash('alert'), users });
  } catch (err) {
    console.log('Error while rendering users list', err);
  }
};

// will block/unblock users based on fetch request
const usersPost = async (req, res) => {
  try {
    const user = await userSchema.findOne({ email: req.body.email });
    
    await userSchema.updateOne({ email: req.body.email }, { isBlocked: user.isBlocked ? false : true });
    
    const updatedUser = await userSchema.findOne({ email: req.body.email });

    res.json({ isBlocked: updatedUser.isBlocked});
  } catch (err) {
    res.json({error: true});

    console.log('Error on users post', err);
  }
};

module.exports = {
  users,
  usersPost,
};  