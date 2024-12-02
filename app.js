const express = require('express');
const app = express();
const path = require('node:path');
// create variables inside '.env' to use through 'process.env'
const dotEnv = require('dotenv').config();
const session = require('express-session');
// create layout header for both user and admin
const expressLayouts = require('express-ejs-layouts');
const { v4: uuidv4 } = require('uuid');

// requiring schemas
const productSchema = require('./model/productSchema');
const categorySchema = require('./model/categorySchema');

// admin and user routers
const adminRouters = require('./router/adminRouter');
const userRouters = require('./router/userRouter');

// requiring mongodb
const connectDB = require('./config/connection');

// for parsing cookie
const cookieParser = require('cookie-parser');

// required for not caching server responses
const noCache = require('nocache');

// for flashing messages
const flash = require('connect-flash');

// required for authentication purpose
const passport = require('passport');

// use port number from '.env' if exists otherwise use '5000' by default
const port = process.env.PORT || 5000;

// mounting 'cookie-parser' middleware 
app.use(cookieParser());

// connecting mongodb
connectDB();

// mounting 'nocache' middleware
app.use(noCache());

// mounting 'connect-flash' middleware
app.use(flash());

// static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, 'public', 'css')));
app.use('/image', express.static(path.join(__dirname, 'public', 'image')));
app.use('/sweetalert', express.static(path.join(__dirname, 'node_modules', 'sweetalert2', 'dist')));
app.use('/mdb-ui-kit-pro', express.static(path.join(__dirname, 'node_modules', 'mdb-ui-kit-pro')));
app.use('/cropperjs', express.static(path.join(__dirname, 'node_modules', 'cropperjs')));

// will parse incoming request bodies and can be used for further processing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// manages the session
app.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// mounting and initialization of 'passport'
app.use(passport.initialize());
app.use(passport.session());

// setting 'ejs'
app.use(expressLayouts);
app.set('layout', './layouts/layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// mounting route handlers
app.use('/', userRouters);
app.use('/admin', adminRouters);

// for handling unspecified routes
app.get('*', async (req, res) => {
  const activeCategories = await productSchema.find({
    isActive: true,
    productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
  })
    .populate('productCategory');

  const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

  res.render('pageNotFound', { title: 'Page not found', alert: req.flash('alert'), user: req.session.user, activeCategoryNames, content: '' });
});

// error handling middleware
app.use(async (err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500);

  const activeCategories = await productSchema.find({
    isActive: true,
    productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
  })
    .populate('productCategory');

  const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

  res.render('error', { title: 'Error', alert: req.flash('alert'), user: req.session.user, activeCategoryNames, content: '', message: 'Internal Server Error' });
});

// listening port
app.listen(port, (err) => {
  if (err) {
    console.log(`Error occurred while listening to port ${err}`);
  } else {
    console.log(`Server is running on http://127.0.0.1:${port}`);
  }
});