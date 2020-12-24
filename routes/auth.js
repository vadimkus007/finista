var authController = require('../controllers/authcontroller.js');
var quotesController = require('../controllers/quotescontroller.js');
var favoritesController = require('../controllers/favoritescontroller.js');
var portfolioController = require('../controllers/portfoliocontroller.js');
 
module.exports = function(app, passport) {
 
    app.get('/signup', authController.signup);
    app.get('/signin', authController.signin);
    app.get('/dashboard', isLoggedIn, authController.dashboard);
    app.get('/logout', authController.logout);

    app.get('/quotes', quotesController.list);
    app.get('/quotes/:secid', quotesController.info);
    app.post('/quotes/:secid', quotesController.favorite);

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

    app.get('/portfolio', isLoggedIn, portfolioController.list);
    app.post('/portfolio', isLoggedIn, portfolioController.action);
    app.get('/portfolio/new', isLoggedIn, portfolioController.new);
    app.get('/portfolio/edit/:id', isLoggedIn, portfolioController.edit);

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        req.session.returnTo = req.url;
        res.redirect('/signin');
    }
}