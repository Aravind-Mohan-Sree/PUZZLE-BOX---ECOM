// will redirect to admin login page
const admin = (req, res) => {
  res.redirect('/admin/login');
};

// will render admin login page if admin session is not present
const login = (req, res) => {
  try {
    if (req.session.admin) {    
      res.redirect('/admin/dashboard');
    } else {
      if (req.query.logout) {
        req.flash('alert', { message: 'Logout successful!', color: 'bg-danger' });
      }

      res.render('admin/login', {title: 'Admin Login', alert: req.flash('alert')});
    }
  } catch (err) {
    console.error(`Error while rendering admin login page ${err}`);
  }
};

// will send admin login form data to the server for verification
const loginPost = (req, res) => {
  try {
    if (req.body.email === process.env.ADMIN_EMAIL && req.body.password === process.env.ADMIN_PASSWORD) {
      req.session.admin = req.body.email;

      res.json({url: '/admin/dashboard?login=true'});
    } else {
      if (req.body.email !== process.env.ADMIN_EMAIL) {
        res.json({wrongEmail: true});
      } else {
        res.json({wrongPassword: true});
      }
    }
  } catch (err) {
    res.json({error: true});

    console.error(`Error on admin login post ${err}`);
  }
};

// will render admin dashboard page if admin session is present
const dashboard = (req, res) => {
  try {
    if (req.query.login) {
      req.flash('alert', { message: 'Login successful!', color: 'bg-success' });
    }

    res.render('admin/dashboard', {title: 'Dashboard', alert: req.flash('alert')});
  } catch (err) {
    console.error(`Error while rendering admin dashboard page ${err}`);
  }
};

// will logout admin
const logout = (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.log(err);
      } else {
        res.json({url: '/admin/login?logout=true'});
      }
    });
  } catch (err) {
    console.log('Error on admin logout post');
  }
};

module.exports = {
  admin,
  login,
  loginPost,
  dashboard,
  logout,
};