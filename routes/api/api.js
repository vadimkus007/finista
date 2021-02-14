const express = require('express');
var router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require('../../config/config.js');

const quotesController = require('../../controllers/api/quotescontroller');

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
    let user = req.user.dataValues

    res.json(user);
});

router.post('/user', (req, res, next) => {

    passport.authenticate('jwt-update', (err, user, done) => {
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

            return res.json({
                user, 
                token,
                message: req.flash('message')[0]
            });
        });

    })(req, res, next);

});

router.post('/signup', (req, res, next) => {

    passport.authenticate('local-signup', (err, user, done) => {
        if (err || !user) {
            return res.status(400).json({
                message: req.flash('message'),
                error: err
            });
        }

        res.json({user});

    })(req, res, next);
});

router.get('/quotes', quotesController.list);

router.get('/quotes/:secid', quotesController.info);

router.post('/quotes/:secid', quotesController.toggleFavorite);


module.exports = router;