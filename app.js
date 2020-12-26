const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

var app = express();
var passport   = require('passport');
var session    = require('express-session');
var bodyParser = require('body-parser');
var env = require('dotenv').config({path:'./.env'});
var flash = require('connect-flash');

//For BodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// For Passport
app.use(session({ secret: 'keyboard cat',resave: true, saveUninitialized:true})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// view engine setup
app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));
// app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/')));
app.use('/popper', express.static(path.join(__dirname, '/node_modules/popper.js/dist/')));
app.use('/highcharts', express.static(path.join(__dirname, '/node_modules/highcharts/')));

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
// const quotesRouter = require('./routes/quotes');
const authRoute = require('./routes/auth')(app,passport);

// Routing
app.use('/', indexRouter);
app.use('/users', usersRouter);

//Models
var models = require("./models");

//load passport strategies
require('./config/passport/passport.js')(passport, models.User);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//Sync Database
models.sequelize.sync().then(function() {
    console.log('Nice! Database looks fine')
}).catch(function(err) {
    console.log(err, "Something went wrong with the Database Update!")
});

module.exports = app;
