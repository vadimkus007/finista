const express = require('express');
var router = express.Router();


router.get('/', (req, res, next) => {
    res.json({message: 'private data'});
});

module.exports = router;