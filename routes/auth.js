var authController = require('../controllers/authcontroller.js');
// var quotesController = require('../controllers/quotescontroller.js');
var favoritesController = require('../controllers/favoritescontroller.js');
var portfoliosController = require('../controllers/portfolioscontroller.js');
var portfolioController = require('../controllers/portfoliocontroller.js');
var operationController = require('../controllers/operationcontroller.js');
var tradesController = require('../controllers/tradescontroller.js');
var analyticsController = require('../controllers/analyticscontroller.js');
var profitController = require('../controllers/profitcontroller.js');
var rebalanceController = require('../controllers/rebalancecontroller.js');
var importController = require('../controllers/importcontroller.js');
 
module.exports = function(app, passport) {
 
    app.get('/signup', authController.signup);
    app.get('/signin', authController.signin);
    app.get('/dashboard', isLoggedIn, authController.dashboard);
    app.get('/logout', authController.logout);

    app.get('/favorites', isLoggedIn, favoritesController.list);
    app.post('/favorites', isLoggedIn, favoritesController.action);

//    app.get('/quotes', quotesController.list);
//    app.get('/quotes/:secid', quotesController.info);
//    app.post('/quotes/:secid', quotesController.favorite);

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/quotes',
        failureRedirect: '/signup'
    }));

    app.post('/signin', passport.authenticate('local-signin', {
        successReturnToOrRedirect: '/favorites',
        failureRedirect: '/signin',
        failureFlash : true
    }));

    app.get('/portfolios', isLoggedIn, portfoliosController.list);
    app.post('/portfolios', isLoggedIn, portfoliosController.action);

    app.get('/operations', isLoggedIn, operationController.list);
    app.post('/operations', isLoggedIn, operationController.action);
    app.get('/operations/new', isLoggedIn, operationController.new);
    app.get('/operations/edit/:id', isLoggedIn, operationController.edit);

    app.get('/portfolio', isLoggedIn, portfolioController.info);
    
    app.get('/portfolio/trades', isLoggedIn, tradesController.list);
    app.post('/portfolio/trades', isLoggedIn, tradesController.action);
    app.get('/portfolio/trades/import', isLoggedIn, tradesController.import);
    app.post('/portfolio/trades/import', isLoggedIn, importController.import);

    app.get('/portfolio/analytics', isLoggedIn, analyticsController.info);

    app.get('/portfolio/profit', isLoggedIn, profitController.info);

    app.get('/portfolio/rebalance', isLoggedIn, rebalanceController.show);
    app.post('/portfolio/rebalance', isLoggedIn, rebalanceController.action);

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        req.session.returnTo = req.url;
        res.redirect('/signin');
    }
}