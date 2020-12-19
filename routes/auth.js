var authController = require('../controllers/authcontroller.js');
var quotesController = require('../controllers/quotescontroller.js');
var favoritesController = require('../controllers/favoritescontroller.js');
 
module.exports = function(app, passport) {
 
    app.get('/signup', authController.signup);
    app.get('/signin', authController.signin);
    app.get('/dashboard', isLoggedIn, authController.dashboard);
    app.get('/logout', authController.logout);

    app.get('/quotes', quotesController.list);
    app.get('/quotes/:secid', quotesController.info);

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/quotes',
        failureRedirect: '/signup'
    }));

    app.post('/signin', passport.authenticate('local-signin', {
        successReturnToOrRedirect: '/favorites',
        failureRedirect: '/signin',
        failureFlash : true
    }));

    app.get('/favorites', isLoggedIn, favoritesController.list);
    app.post('/favorites', isLoggedIn, favoritesController.action);

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        res.redirect('/signin');
    }
}