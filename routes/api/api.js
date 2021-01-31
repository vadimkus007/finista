const express = require('express');
var router = express.Router();
const passport = require('passport');

const config = require('../../config/config.js');

router.get('/', (req, res, next) => {
  res.json({'message' : 'API router'});
});

// SIGNIN
router.post('/signin', (req, res, next) => {

    passport.authenticate('local-signin', (err, user, done) => {

        if (err || !user) {
            return res.status(400).json({
                message: 'Login failed',
                user: user
            });
        }

        delete user.password;

        req.login(user, {session: false}, (err) => {
            if (err) {
                res.send(err);
            }

            const token = jwt.sign(user, config.secret);

            return res.json({user, token});
        });

    })(req, res, next);
});

router.get('/signin', (req, res, next) => {
    res.json({message: 'GET /api/signin'});
});

router.get('/user', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    res.json({message: 'private data'});
});


module.exports = router;