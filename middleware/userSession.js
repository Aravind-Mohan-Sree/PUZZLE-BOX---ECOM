// checks if the user session exists, otherwise will be redirected to login page
function checkUserSession (req, res, next) {
  if (req.session.user) {
    // will be redirect to next route
    next();
  } else {
    res.redirect('/login');
  }
}

module.exports = checkUserSession;