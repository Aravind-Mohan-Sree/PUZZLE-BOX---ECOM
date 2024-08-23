const userSchema = require('../model/userSchema');

// checks whether user is blocked
async function checkUserBlocked(req, res, next) {
  if (req.session.user) {
    const userDetails = await userSchema.findById(req.session.user);

    if (userDetails.isBlocked) {
      delete req.session.user;

      res.redirect('/login?isBlocked=true');
    } else {
      next();
    }
  } else {
    next();
  }
};

module.exports = checkUserBlocked;