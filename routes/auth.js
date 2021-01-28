var authController = require('../controllers/authcontroller.js');
var favoritesController = require('../controllers/favoritescontroller.js');
var portfoliosController = require('../controllers/portfolioscontroller.js');
var operationController = require('../controllers/operationcontroller.js');

var portfolioRouter = require('../routes/portfolio.js');
var usersRouter = require('../routes/users.js');
 
module.exports = function(app, passport) {
 
    app.get('/signup', authController.signup);
    app.get('/signin', authController.signin);

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/quotes',
        failureRedirect: '/signup'
    }));

    app.post('/signin', passport.authenticate('local-signin', {
        successReturnToOrRedirect: '/favorites',
        failureRedirect: '/signin',
        failureFlash : true
    }));

    app.get('/logout', authController.logout);

    app.get('/favorites', isLoggedIn, favoritesController.list);
    app.post('/favorites', isLoggedIn, favoritesController.action);

    app.get('/portfolios', isLoggedIn, portfoliosController.list);
    app.post('/portfolios', isLoggedIn, portfoliosController.action);

    app.get('/operations', isLoggedIn, operationController.list);
    app.post('/operations', isLoggedIn, operationController.action);
    app.get('/operations/new', isLoggedIn, operationController.new);
    app.get('/operations/edit/:id', isLoggedIn, operationController.edit);

    app.use('/portfolio', isLoggedIn, portfolioRouter);

    app.use('/users', isLoggedIn, usersRouter);
    app.post('/users/profile', passport.authenticate('local-change-profile', {
        successRedirect: '/users/profile',
        failureRedirect: '/users/profile',
        failureFlash: true
    }))

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        req.session.returnTo = req.originalUrl;
        res.redirect('/signin');
    }

}