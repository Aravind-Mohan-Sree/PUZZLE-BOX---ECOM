const userSchema = require("../model/userSchema");

async function checkUserSession(req, res, next) {
  try {
    if (req.session.user) {
      const userDetails = await userSchema.findById(req.session.user);

      // if the logged user is blocked then delete the session and redirect to login
      if (userDetails && !userDetails.isBlocked) {
        next();
      } else {
        delete req.session.user;

        res.redirect('/login');
      }
    } else {
      // if user does not exist then redirect to login
      res.redirect('/login')
    }

  } catch (err) {
    console.error(`Error in checkUserSession middleware ${err}`);
  }
}

module.exports = checkUserSession;