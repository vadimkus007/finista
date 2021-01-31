const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// JWT strategy
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const bCrypt = require('bcryptjs');

const User = require('../../models/user');

const config = require('../../config/config.js');

passport.use(new LocalStrategy(
    {
        userNameField: 'email',
        passwordField: 'password'
    },
    function (user, done) {

        var generateHash = function(password) {
                return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
            };

        var userPassword = generateHash(password);

        return User.findOne({email, userPassword})
        .then(user => {
            if (!user) {
                return done(null, false, {message: 'Incorrect email or password.'});
            }

            return done(null, user, {message: 'Logged Is Successfully.'})
        })
        .catch(err => {
            done(err);
        })

    }
));

passport.use(new JWTStrategy(

    {
        jwtFromRequest: ExtractJWT.fromHeader('Authorization'),
        secretOrKey: config.secret
    },
    function (jwtPayload, done) {
console.log(jwtPayload);
        // find user in db
        User.findOneById(jwtPayload.id)

        .then(user => {
            return done(null, user);
        })
        .catch(err => {
            return done(err);
        })
    }

));