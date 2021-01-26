const models = require('../models');
const Portfolio = models.Portfolio;

var flash = require('connect-flash');


var exports = module.exports = {}

exports.list = (req, res, next) => {

    const user = req.session.passport.user;

    // remove portfolio id from session
    if (req.session && req.session.portfolio !== null) {
        delete req.session.portfolio;
    }

    Portfolio.findAll({
        where: {userId: user},
        raw: true
    })
    .then(rows => {

        // render view
        res.render('portfolios/index', {
            title: 'Портфели',
            user: req.session.passport.user,
            data: rows
        });

    })
    .catch((err) => {
        console.log('Error reading portfolios: ', err);
        next(err);
    });
}

exports.action = (req, res, next) => {
    
    switch (req.body.action) {

        case 'delete':

            if (req.body.portfolioId != '') {
                Portfolio.destroy({
                    where: {
                        id: parseInt(req.body.portfolioId)
                    }
                })
                .then(rowDeleted => {
                        if (rowDeleted > 0) {
                            console.log(`Portfolio ${req.body.title} deleted successfully.`);
                        }
                })
                .catch(err => {
                    console.log('Error deleting portfolio:', err);
                    next(err);
                });

            }

            res.redirect('portfolios');
            break;

        case 'save':

            if (req.body.id !== '') {

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
                            userId: req.session.passport.user
                        })
                        .then(createdItem => {
                            console.log('New Portfolio created');
                            res.redirect('portfolios');
                        })
                        .catch(err => {
                            console.log('Error creating new record:', err);
                            res.render('portfolios/edit', {
                                title: 'Новый портфель',
                                user: req.session.passport.user,
                                data: req.body,
                                isNew: false,
                                error: err
                            });
                        });
                    } else {
                        Portfolio.update({
                            title: req.body.title,
                            currency: req.body.currency,
                            comission: (req.body.comission === '') ? 0 : req.body.comission,
                            memo: req.body.memo,
                            dateopen: req.body.dateopen,
                            userId: req.session.passport.user
                        }, {
                            where: {
                                id: req.body.id
                            }
                        })
                        .then((rowsUpdated) => {
                            console.log(`${rowsUpdated} rows updated in Portfolio`);
                            res.redirect('portfolios');
                        })
                        .catch(err => {
                            console.log('Error updating record: ', err);
                            res.render('portfolios/edit', {
                                title: 'Новый портфель',
                                user: req.session.passport.user,
                                data: req.body,
                                isNew: false,
                                error: err
                            });
                        });
                    }

                })

            } else {
                Portfolio.create({
                            title: req.body.title,
                            currency: req.body.currency,
                            comission: (req.body.comission === '') ? 0 : req.body.comission,
                            memo: req.body.memo,
                            dateopen: req.body.dateopen,
                            userId: req.session.passport.user
                        })
                        .then(createdItem => {
                            console.log('New Portfolio created');
                            res.redirect('portfolios');
                        })
                        .catch(err => {

                            console.log('Error creating new record:', err);

                            res.render('portfolios/edit', {
                                title: 'Новый портфель',
                                user: req.session.passport.user,
                                data: req.body,
                                isNew: false,
                                error: err
                            });
                        });
            }

            break;

        case 'edit':
            if (req.body.portfolioId) {

                Portfolio.findOne({
                    where: {
                        id: req.body.portfolioId
                    },
                    raw: true
                })
                .then(row => {
                    if (row) {
                        // found record in db
                        res.render('portfolios/edit', {
                            title: 'Изменить портфель',
                            user: req.session.passport.user,
                            data: row,
                            isNew: false
                        });
                    } else {
                        res.render('portfolios/edit', {
                            title: 'Новый портфель',
                            user: req.session.passport.user,
                            data: {},
                            isNew: true
                        })
                    }
                })
                .catch(err => {
                    console.log('Error reading portfolio: ', err);
                    next(err);
                });

            } else {
                res.render('portfolios/edit', {
                    title: 'Новый портфель',
                    user: req.session.passport.user,
                    data: {},
                    isNew: true
                })
            }

            break;
        case 'cancel':
            res.redirect('/portfolios');
            break;
        // select portfolio
        default:
            if (req.session) {
                if (req.body.portfolioId && req.body.portfolioId !== '') {
                    
                    req.session.portfolio = {};
                    req.session.portfolio.id = req.body.portfolioId;

                    res.redirect(`/portfolio/`);
                }
            } 
    }
}

