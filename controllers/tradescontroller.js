const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;
const Operation = models.Operation;

var exports = module.exports = {}

exports.action = (req, res, next) => {
    
    switch (req.body.action) {

        case 'save':

            if (req.body.id === '') {

                Trade.findOne({
                    where: {id: parseInt(req.params.id)},
                    raw: true
                })
                .then(foundOne => {

                    if(!foundOne) {
                        // Trade create
                        Trade.create({
                            portfolioId: parseInt(req.body.portfolioId),
                            operationId: parseInt(req.body.operationId),
                            secid: req.body.secid,
                            price: req.body.price,
                            amount: parseInt(req.body.amount),
                            date: req.body.date,
                            comment: req.body.comment,
                            comission: (req.body.comission === '') ? 0 : req.body.comission
                        })
                        .then(() => {
                            console.log('New Trade created!');
                            res.redirect(`/portfolio/${req.params.id}/trades`);
                        })
                        .catch(err => {

                            console.log('Error creating Trade: ', err);

                            var data = {};
                            data.trade = req.body;
                            data.isNew = false;

                            // find Portfolio
                            Portfolio.findOne({
                                where: {
                                    id: req.params.id
                                },
                                raw: true
                            })
                            .then(portfolio => {
                                data.portfolio = portfolio;

                                Operation.findAll({
                                    raw: true
                                })
                                .then(operations => {
                                    data.operations = operations;

                                    res.render('portfolio/trade-edit', {
                                        data: data,
                                        error: err
                                    });

                                }).catch(err=>console.log('Error reading operations'));
                            }).catch(err=>console.log('Error reading portfolio'));

                        });

                    } else {
                        // Trade update
                        Trade.update({
                            portfolioId: parseInt(req.body.portfolioId),
                            operationId: parseInt(req.body.operationId),
                            secid: req.body.secid,
                            price: req.body.price,
                            amount: parseInt(req.body.amount),
                            date: req.body.date,
                            comment: req.body.comment,
                            comission: (req.body.comission === '') ? 0 : req.body.comission
                        }, {
                            where: {
                                id: parseInt(req.body.id)
                            }
                        })
                        .then((rowsUpdated) => {
                            console.log(`${rowsUpdated} rows updated in Trades`);
                            res.redirect(`/portfolio/${req.params.id}/trades`);
                        })
                        .catch(err => {
                            console.log('Error updating Trades table: ', err);
                            
                            var data = {};
                            data.trade = req.body;
                            data.isNew = false;

                            // find Portfolio
                            Portfolio.findOne({
                                where: {
                                    id: req.params.id
                                },
                                raw: true
                            })
                            .then(portfolio => {
                                data.portfolio = portfolio;

                                Operation.findAll({
                                    raw: true
                                })
                                .then(operations => {
                                    data.operations = operations;

                                    res.render('portfolio/trade-edit', {
                                        data: data,
                                        error: err
                                    });

                                }).catch(err=>console.log('Error reading operations'));
                            }).catch(err=>console.log('Error reading portfolio'));

                        });
                    }

                })

                
            } else {

                Trade.create({
                    portfolioId: parseInt(req.body.portfolioId),
                    operationId: parseInt(req.body.operationId),
                    secid: req.body.secid,
                    price: req.body.price,
                    amount: parseInt(req.body.amount),
                    date: req.body.date,
                    comment: req.body.comment,
                    comission: (req.body.comission === '') ? 0 : req.body.comission
                })
                .then(() => {
                    console.log('New Trade created!');
                    res.redirect(`/portfolio/${req.params.id}/trades`);
                })
                .catch(err => {

                    console.log('Error creating Trade: ', err);
                    

                    var data = {};
                    data.trade = req.body;
                    data.isNew = false;

                            // find Portfolio
                            Portfolio.findOne({
                                where: {
                                    id: req.params.id
                                },
                                raw: true
                            })
                            .then(portfolio => {
                                data.portfolio = portfolio;

                                Operation.findAll({
                                    raw: true
                                })
                                .then(operations => {
                                    data.operations = operations;

                                    res.render('portfolio/trade-edit', {
                                        data: data,
                                        error: err
                                    });

                                }).catch(err=>console.log('Error reading operations'));
                            }).catch(err=>console.log('Error reading portfolio'));

                });

            }

            break;

        case 'edit':
console.log('REQ.BODY on EDIT: ', req.body);
            var data = {};

            if (req.body.id) {

                // EDIT form

                data.isNew = false;

                // get portfolio info
                Portfolio.findOne({
                    where: {id: parseInt(req.params.id)},
                    raw: true
                })
                .then(portfolio => {
                    if (portfolio === null) {
//                        console.log('Portfolio not found!');
                    }

                    data.portfolio = portfolio;
                    data.portfolioId = req.params.id;

                    // get Trade info
                    Trade.findOne({
                        where: {id: parseInt(req.body.id)},
                        raw: true
                    })
                    .then(trade => {

                        data.trade = trade;

                        // get Operations for form construction
                        Operation.findAll({
                            raw: true
                        })
                        .then(operations => {
                            data.operations = operations;

                            // render view
                            res.render('portfolio/trade-edit', {
                                data: data
                            });
                        })
                        .catch(err => {
                            console.log('Error getting Operations: ', err);
                        }); // operations
                    })
                    .catch(err => {
                        console.log('Error getting Trade: ', err)
                    }); // trade
                })
                .catch(err => {
                    console.log('Error getting Portfolio: ', err);
                }); // portfolio

            } else {

                // CREATE form

                data.isNew = true;

                // get portfolio info
                Portfolio.findOne({
                    where: {id: parseInt(req.params.id)},
                    raw: true
                })
                .then(portfolio => {
                    if (portfolio === null) {
                        console.log('Portfolio not found!');
                    }

                    data.portfolio = portfolio;

                    // get Operations for form construction
                    Operation.findAll({
                        raw: true
                    })
                    .then(operations => {
                        data.operations = operations;

// console.log(data);

                        // render view
                        res.render('portfolio/trade-edit', {
                            data: data
                        });

                    })
                    .catch(err => {
                        console.log('Error getting Operations: ', err);
                    }); // operations
                })
                .catch(err => {
                    console.log('Error getting Portfolio: ', err);
                }); // portfolio
            }

            break;

        case 'delete':
            if (req.body.id != '') {
                Trade.destroy({
                    where: {
                        id: parseInt(req.body.id)
                    }
                })
                .then(rowDeleted => {
                        if (rowDeleted > 0) {
                            console.log(`Trade deleted successfully.`);
                        }
                })
                .catch(err => console.log('Error deleting record:', err));

            }

            res.redirect(`/portfolio/${req.params.id}/trades`);
            break;

        default:
            res.redirect(`/portfolio/${req.params.id}/trades`);
    }

}

exports.list = (req, res, next) => {

    var data = {};

    // get portfolio info
    Portfolio.findOne({
        where: {id: parseInt(req.params.id)},
        raw: true
    })
    .then(portfolio => {
        if (portfolio === null) {
          console.log('Not found!');
        } 

        data.portfolio = portfolio;
        
        // get Trades
        Trade.findAll({
            where: {
                portfolioId: req.params.id
            },
            include: [
                {
                    model: Operation,
                    as: 'operation',
                    required: false 
                }
            ],
            order: [
                ['date', 'DESC']
            ],
            raw: true
        })
        .then(rows => {

            data.trades = rows;

            // render view
            res.render('portfolio/trades', {
                data: data
            });


        })
        .catch(err => {
            console.log('Error reading trades: ', err)
        });

    })
    .catch(err => {
        console.log('Error reading portfolio: ', err)
    });

}

