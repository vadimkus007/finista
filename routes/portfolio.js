var express = require('express');
var router = express.Router();

const portfolioController = require('../controllers/portfoliocontroller.js');
const tradesController = require('../controllers/tradescontroller.js');
const importController = require('../controllers/importcontroller.js');
const analyticsController = require('../controllers/analyticscontroller.js');
const profitController = require('../controllers/profitcontroller.js');
const rebalanceController = require('../controllers/rebalancecontroller.js');

router.get('/', portfolioController.select);

router.get('/actives', portfolioController.info);
    
router.get('/trades', tradesController.list);
router.post('/trades', tradesController.action);

router.get('/trades/import', tradesController.import);
router.post('/trades/import', importController.import);

router.get('/analytics', analyticsController.info);

router.get('/profit', profitController.info);

router.get('/rebalance', rebalanceController.show);
router.post('/rebalance', rebalanceController.action);

module.exports = router;