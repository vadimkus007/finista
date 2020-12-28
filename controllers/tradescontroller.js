const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;
const Operation = models.Operation;

var exports = module.exports = {}

exports.action = (req, res, next) => {
    
    switch (req.body.action) {

        case 'save':

            if (req.body.id === '') {
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
                    console.log('VALIDATION success!');
                })
                .catch(err => {

                    console.log('Error creating Trade: ', err);

                });
            } else {
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
                })
                .catch(err => {
                    console.log('Error updating Trades table: ', err);
                });

            }

            res.redirect(`/portfolio/${req.params.id}/trades`);
            break;

        case 'edit':

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

exports.new = (req, res, next) => {
    
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

        // Prepare form data

        Operation.findAll({
            raw: true
        })
        .then(operations => {
            data.operations = operations;
            //console.log(data);
            //console.log('params: ', req.params);
            //console.log('body: ', req.body);

            // render view
            res.render('portfolio/trade-edit', {
                data: data
            }); // render
        })
        .catch(err => console.log('Error reading operations: ', err)) // operations

    })
    .catch(err => {console.log('Error reading portfolio: ', err)}); // portfolio

}

