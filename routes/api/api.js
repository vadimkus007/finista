const express = require('express');
var router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require('../../config/config.js');

router.get('/', (req, res, next) => {
  res.json({'message' : 'API router'});
});

// SIGNIN
router.post('/signin', (req, res, next) => {

// console.log('REQ.body', req.body);


    passport.authenticate('local-signin', (err, user, done) => {

        if (err || !user) {
            return res.status(400).json({
                message: req.flash('message'),
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
    res.json({message: req.flash('message')[0]});
});

router.get('/user', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    res.json({message: 'private data'});
});

router.post('/signup', (req, res, next) => {

console.log('req.body', req.body);

    passport.authenticate('local-signup', (err, user, done) => {
        if (err || !user) {
            return res.status(400).json({
                message: req.flash('message'),
                error: err
            });
        }

        res.json({user});

    })(req, res, next);
})


module.exports = router;