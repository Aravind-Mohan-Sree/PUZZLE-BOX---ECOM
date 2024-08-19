// will render user home page
const home = (req, res) => {
  try {
    if (req.query.login) {
      req.flash('alert', { message: 'Login successful!', color: 'bg-success-subtle' });
    }

    res.render('user/home', {title: 'Home', alert: req.flash('alert'), user: req.session.user})
  } catch (err) {
    console.log('Error while rendering user home page', err);
  }
};

module.exports = {
  home,
};