const express = require('express');

const router = express.Router();

const usersController = require('../controllers/userscontroller.js');

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});

router.get('/profile', usersController.profile);

module.exports = router;
