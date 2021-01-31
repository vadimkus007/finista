const createError = require('http-errors');
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const env = require('dotenv').config({ path:'./.env' });
const flash = require('connect-flash');

const config = require('./config/config.js');

// For BodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'tmp')
}));

app.use(flash());

// For Passport
app.use(session({ secret: config.secret, resave: true, saveUninitialized:true })); // session secret
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

app.use(express.static(path.join(__dirname, 'public')));
// app.use('/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/')));
// app.use('/popper', express.static(path.join(__dirname, '/node_modules/popper.js/dist/')));
app.use('/highcharts', express.static(path.join(__dirname, '/node_modules/highcharts/')));
app.use('/fontawesome', express.static(path.join(__dirname, '/node_modules/@fortawesome/fontawesome-free/')));

// Models
var models = require("./models");

// load passport strategies
require('./config/passport/passport.js')(passport, models.User);

// Routing
const indexRouter = require('./routes/index');
const authRoute = require('./routes/auth')(app,passport);
const apiRoute = require('./routes/api/api');

app.use('/', indexRouter);
app.use('/api', apiRoute);

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
console.log('res.statusCode: ',res.statusCode);
console.log('err.status', err.status);
    res.status(typeof err.status == 'undefined' ? err.status = 500 : err.status || 500);
    if (404 === err.status) {
        res.format({
            'text/plain': () => {
                res.send({message: 'not found Data'});
                },
            'text/html': () => {
                res.render('404');
                },
            'application/json': () => {
                res.send({message: 'not found Data'});
                },
            'default': () => {
                res.status(406).send('Not Acceptable');
            }
        })
    }
    // when status is 500, error handler
    if(500 === err.status) {
        return res.render('error');
    }
    
});

// Sync Database
models.sequelize.sync().then(function() {
    console.log('Nice! Database looks fine')
}).catch(function(err) {
    console.log(err, "Something went wrong with the Database Update!")
});

module.exports = app;
