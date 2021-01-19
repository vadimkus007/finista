var express = require('express');
var router = express.Router();
var quotesController = require('../controllers/quotescontroller.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.redirect('/quotes');
});

router.get('/quotes', quotesController.list);

router.get('/quotes/:secid', quotesController.info);

router.post('/quotes/:secid', quotesController.favorite);

module.exports = router;
