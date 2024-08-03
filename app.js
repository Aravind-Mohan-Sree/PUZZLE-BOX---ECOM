const express = require('express');
const app = express();
const path = require('node:path');
// create variables inside '.env' to use through 'process.env'
const dotEnv = require('dotenv').config();
const session = require('express-session');
// create layout header for both user and admin
const expressLayouts = require('express-ejs-layouts');
const {v4: uuidv4} = require('uuid');

// admin and user routers
const adminRouters = require('./router/adminRouter');
// const userRouters = require('./router/userRouter');

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
app.use('/style', express.static(path.join(__dirname, 'public', 'style')));
app.use('/image', express.static(path.join(__dirname, 'public', 'image')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));

// will parse incoming request bodies and can be used for further processing
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// manages the session
app.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: true,
  cookie: {secure: false}
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
// app.use('/', userRouters);
app.use('/admin', adminRouters);

// for handling unspecified routes
app.get('*', (req, res) => {
  res.render('pageNotFound', {title: '404 Page not found'});
});

// listening port
app.listen(port, (err) => {
  if (err) {
    console.log(`Error occurred while listening to port ${err}`);
  } else {
    console.log(`Server is running on http://127.0.0.1:${port}`);
  }
});