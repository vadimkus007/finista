const models = require('../../models');
const Portfolio = models.Portfolio;

const passport = require('passport');

var exports = module.exports = {}

exports.list = (req, res, next) => {

    passport.authenticate('jwt', (err, user, done) => {

        if (err || !user) {
            return res.status(401).json({
                message: 'Anauthorized',
                user: user
            });
        }

        Portfolio.findAll({
            where: {userId: user.id},
            raw: true
        })
        .then(rows => {

            res.json({
                portfolios: rows
            });
        })
        .catch(err => {
            res.json({
                error: 'Error reading portfolios'
            });
            next(err);
        });

    })(req, res, next);

}

exports.save = (req, res, next) => {
    if (req.body.id && req.body.id !== '') {

                Portfolio.findOne({
                    where: {
                        id: req.body.id
                    },
                    raw: true
                })
                .then(foundOne => {

                    if (!foundOne) {
                        Portfolio.create({
                            title: req.body.title,
                            currency: req.body.currency,
                            comission: (req.body.comission === '') ? 0 : req.body.comission,
                            memo: req.body.memo,
                            dateopen: req.body.dateopen,
                            userId: req.userId
                        })
                        .then(createdItem => {
                            console.log('New Portfolio created');
                            res.json({
                                message: 'Portfolio created successfully',
                                portfolio: createdItem
                            });
                            // return next();
                        })
                        .catch(err => {
                            console.log('Error creating new record:', err);
                            res.json({
                                error: err
                            });
                            // return next();
                        });
                    } else {
                        Portfolio.update({
                            title: req.body.title,
                            currency: req.body.currency,
                            comission: (req.body.comission === '') ? 0 : req.body.comission,
                            memo: req.body.memo,
                            dateopen: req.body.dateopen,
                            userId: req.userId
                        }, {
                            where: {
                                id: req.body.id
                            }
                        })
                        .then((rowsUpdated) => {
                            console.log(`${rowsUpdated} rows updated in Portfolio`);
                            res.json({
                                message: 'Portfolio saved'
                            });
                            // return next();
                        })
                        .catch(err => {
                            console.log('Error updating record: ', err);
                            res.json({
                                error: err
                            });
                            // return next();
                        });
                    }

                })

            } else {
                if (!req.body.userId) {
                    res.json({
                        error: 'Incorrect user id'
                    });
                    // return next();
                }
                Portfolio.create({
                            title: req.body.title,
                            currency: req.body.currency,
                            comission: (req.body.comission === '') ? 0 : req.body.comission,
                            memo: req.body.memo,
                            dateopen: req.body.dateopen,
                            userId: req.body.userId
                        })
                        .then(createdItem => {
                            console.log('New Portfolio created');
                            res.json({
                                message: 'Portfolio created successfully',
                                portfolio: createdItem
                            });
                            // return next();
                        })
                        .catch(err => {

                            console.log('Error creating new record:', err);

                            res.json({
                                error: err
                            });
                            // return next();
                        });
            }

}