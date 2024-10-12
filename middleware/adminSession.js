// checks if the admin session exists, otherwise will be redirected to login page
function checkAdminSession(req, res, next) {
  if (req.session.admin) {
    // will be redirect to next route
    next();
  } else {
    res.redirect('/admin/login');
  }
}

module.exports = checkAdminSession;