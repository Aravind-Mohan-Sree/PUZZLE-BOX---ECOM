function saveAdmin(req, res, next) {
  try {
    const admin = req.session.admin;

    res.locals.admin = admin;

    next();
  } catch (err) {
    console.log(err);
  }
}

module.exports = saveAdmin;
