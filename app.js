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
app.use('/style', express.static(path.join(__dirname, 'public', 'style')));
app.use('/image', express.static(path.join(__dirname, 'public', 'image')));

// will parse incoming request bodies and can be used for further processing
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// manages the session
app.use(session({
  secret: uuidv4(),
  
}));