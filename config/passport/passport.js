//load bcrypt
var bCrypt = require('bcryptjs');
 
 
module.exports = function(passport, user) {
 
 
    var User = user;
 
    var LocalStrategy = require('passport-local').Strategy;
 
 
    // SIGNUP
    passport.use('local-signup', new LocalStrategy(
 
        {
 
            usernameField: 'email',
 
            passwordField: 'password',
 
            passReqToCallback: true // allows us to pass back the entire request to the callback
 
        },
 
 
 
        function(req, email, password, done) {
 
            var generateHash = function(password) {
 
                return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
 
            };
 
 
 
            User.findOne({
                where: {
                    email: email
                }
            }).then(function(user) {
 
                if (user)
 
                {
 
                    return done(null, false, {
                        message: 'That email is already taken'
                    });
 
                } else
 
                {
 
                    var userPassword = generateHash(password);
 
                    var data =
 
                        {
                            email: email,
 
                            password: userPassword,
 
                            first_name: req.body.first_name,
 
                            last_name: req.body.last_name
 
                        };
 
                    User.create(data).then(function(newUser, created) {
 
                        if (!newUser) {
 
                            return done(null, false);
 
                        }
 
                        if (newUser) {
 
                            return done(null, newUser);
 
                        }
 
                    });
 
                }
 
            });
 
        }
 
    ));


    //LOCAL SIGNIN
passport.use('local-signin', new LocalStrategy(
 
    {
 
        // by default, local strategy uses username and password, we will override with email
 
        usernameField: 'email',
 
        passwordField: 'password',
 
        passReqToCallback: true // allows us to pass back the entire request to the callback
 
    },
 
 
    function(req, email, password, done) {
 
        var User = user;
 
        var isValidPassword = function(userpass, password) {
 
            return bCrypt.compareSync(password, userpass);
 
        }
 
        User.findOne({
            where: {
                email: email
            }
        }).then(function(user) {
 
            if (!user) {
 
                return done(null, false, {
                    message: req.flash('message', 'Email does not exist')
                });
 
            }
 
            if (!isValidPassword(user.password, password)) {
 
                return done(null, false, {
                    message: req.flash('message', 'Incorrect password.')
                });
 
            }
 
 
            var userinfo = user.get();
            return done(null, userinfo);
 
 
        }).catch(function(err) {
 
            console.log("Error:", err);
 
            return done(null, false, {
                message: req.flash('message', 'Something went wrong with your Signin')
            });
 
        });
 
 
    }
 
));

// LOCAL CHANGE PROFILE
passport.use('local-change-profile', new LocalStrategy(

    { 
        usernameField: 'email',
 
        passwordField: 'password',
 
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },

    function(req, email, password, done) {

        var User = user;

        var isValidPassword = function(userpass, password) {
 
            return bCrypt.compareSync(password, userpass);
 
        };

        var generateHash = function(password) {
                return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
        };

        User.findOne({
            where: {
                email: email
            }
        })
        .then(function(user) {

            if (!isValidPassword(user.password, password)) {
 
                return done(null, false, {
                    message: req.flash('message', 'Incorrect password.')
                });
 
            }

            var userinfo = user.get();

            var data = {
                email: req.body.email,
                first_name: req.body.first_name,
                last_name: req.body.last_name
            }

            if (req.body.newPassword !== '' && req.body.newPassword == req.body.confirmPassword) {

                var userPassword = generateHash(req.body.newPassword);

                data.password = userPassword;

            } 

            User.update(data, {
                where: {
                    id: userinfo.id
                }
            })
            .then(result => {
                return done(null, userinfo, {
                    message: req.flash('message', 'User is updated successfully')
                });
            })
            .catch(err => {
                return done(err);
            });
            
        })
        .catch(err => {
            return done(err);
        })

}));

    //serialize
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
 
    // deserialize user 
    passport.deserializeUser(function(id, done) {
        User.findByPk(id).then(function(user) {
            if (user) {
                done(null, user.get());
            } else {
                done(user.errors, null);
            }
        });
    });
}