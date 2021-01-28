var express = require('express');
var router = express.Router();

const usersController = require('../controllers/userscontroller.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/profile', usersController.profile);


module.exports = router;
