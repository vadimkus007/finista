const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;
const Operation = models.Operation;
const Moex = require('../lib/moex');

var exports = module.exports = {}

var getSecurities = function(cb) {

    const urls = [
        'http://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME',
        'http://iss.moex.com/iss/engines/stock/markets/foreignshares/boards/FQBR/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME',
        'http://iss.moex.com/iss/engines/stock/markets/shares/boards/TQTF/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME'
    ];

    let promises = urls.map(index => Moex.fetchJSON(index));
    Promise.all(promises)
    .then(results => {
        let data = [];
        for (var i = 0; i<results.length; i++) {
            results[i].securities.data.forEach(record => {
                let newRecord = {};
                newRecord['secid'] = record[0];
                newRecord['name'] = record[1];
                if (i === 2) {
                    newRecord['group'] = 'ETF/ПИФ';
                } else {
                    newRecord['group'] = 'Акции';
                }
                data.push(newRecord);
            });
        }
        cb(null, data);
    })
    .catch(err => console.log(err));
}

exports.action = (req, res, next) => {

    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }

    const portfolioId = req.session.portfolio.id;
    
    switch (req.body.action) {

        case 'save':

            if (req.body.id !== '') {

                Trade.findOne({
                    where: {id: parseInt(req.body.id)},
                    raw: true
                })
                .then(foundOne => {

                    if(!foundOne) {
                        // Trade create

                        Trade.create({
                            portfolioId: parseInt(portfolioId),
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
                            res.redirect(`/portfolio/trades`);
                        })
                        .catch(err => {

                            console.log('Error creating Trade: ', err);

                            var data = {};
                            data.trade = req.body;
                            data.isNew = false;

                            // find Portfolio
                            Portfolio.findOne({
                                where: {
                                    id: portfolioId
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

                                    // get securities for list
                                    getSecurities((err_secid, securities) => {
                                        data.securities = securities;
                                        // render view

                                        res.render('portfolio/trade-edit', {
                                            data: data,
                                            error: err
                                        });                           
                                    });

                                }).catch(err=>console.log('Error reading operations'));
                            }).catch(err=>console.log('Error reading portfolio'));

                        });

                    } else {

                        // Trade update
                        Trade.update({
                            portfolioId: parseInt(portfolioId),
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
                            res.redirect(`/portfolio/trades`);
                        })
                        .catch(err => {
                            console.log('Error updating Trades table: ', err);
                            
                            var data = {};
                            data.trade = req.body;
                            data.isNew = false;

                            // find Portfolio
                            Portfolio.findOne({
                                where: {
                                    id: portfolioId
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

                                    // get securities for list
                                    getSecurities((err_secid, securities) => {
                                        data.securities = securities;
                                        // render view

                                        res.render('portfolio/trade-edit', {
                                            data: data,
                                            error: err
                                        });                           
                                    });

                                }).catch(err=>console.log('Error reading operations'));
                            }).catch(err=>console.log('Error reading portfolio'));

                        });
                    }

                })

                
            } else {

                Trade.create({
                    portfolioId: parseInt(portfolioId),
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
                    res.redirect(`/portfolio/trades`);
                })
                .catch(err => {

                    console.log('Error creating Trade: ', err);
                    

                    var data = {};
                    data.trade = req.body;
                    data.isNew = false;

                            // find Portfolio
                            Portfolio.findOne({
                                where: {
                                    id: portfolioId
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

                                    // get securities for list
                                    getSecurities((err_secid, securities) => {
                                        data.securities = securities;
                                        // render view

                                        res.render('portfolio/trade-edit', {
                                            data: data,
                                            error: err
                                        });                           
                                    });

                                }).catch(err=>console.log('Error reading operations'));
                            }).catch(err=>console.log('Error reading portfolio'));

                });

            }

            break;

        case 'edit':

            var data = {};
            var promises = [];
            var func = [];
            
            if (req.body.id) {

                // EDIT form

                func = Portfolio.findOne({
                    where: {id: parseInt(portfolioId)},
                    raw: true
                });
                promises.push(func); // portfolio -> [0]

                func = Trade.findOne({
                    where: {id: parseInt(req.body.id)},
                    raw: true
                });
                promises.push(func); // trade -> [1]

                func = Operation.findAll({
                    raw: true
                });
                promises.push(func); // operations -> [2]

                // perform database search
                Promise.all(promises)
                .then(result => {
                    data.portfolio = result[0];
                    data.trade = result[1];

                    data.operations = result[2];
                    data.isNew = false;

                    // get securities for list
                    getSecurities((err, securities) => {
                        data.securities = securities;
                        // render view
                        res.render('portfolio/trade-edit', {
                            data: data
                        });                           
                    });
                })
                .catch(err => {
                    console.log('Error reading database: ', err);
                });

            } else {

                // CREATE form

                func = Portfolio.findOne({
                    where: {id: parseInt(portfolioId)},
                    raw: true
                });
                promises.push(func); // portfolio [0]
                func = Operation.findAll({
                    raw: true
                });
                promises.push(func); // operations [1]


                Promise.all(promises)
                .then(result => {
                    data.portfolio = result[0];
                    data.operations = result[1];
                    data.isNew = true;

                    // get securities for list
                    getSecurities((err, securities) => {
                        data.securities = securities;
                        // render view
                        res.render('portfolio/trade-edit', {
                            data: data
                        });                           
                    });
                    
                    
                })
                .catch(err => {
                    console.log('Error reading database: ', err);
                })
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

            res.redirect(`/portfolio/trades`);
            break;

        default:
            res.redirect(`/portfolio/trades`);
    }

}

exports.list = (req, res, next) => {

    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }

    const portfolioId = req.session.portfolio.id;

    var data = {};

    var promises = [];
    let func = Portfolio.findOne({
        where: {id: parseInt(portfolioId)},
        raw: true
    });
    promises.push(func); // portfolio
    func = Trade.findAll({
            where: {
                portfolioId: portfolioId
            },
            include: [
                {
                    model: Operation,
                    as: 'operation',
                    required: false   // LEFT JOIN
                }
            ],
            order: [
                ['date', 'DESC']
            ],
            raw: true
        });
    promises.push(func); // trades

    Promise.all(promises)
    .then(results => {
        data.portfolio = results[0];
        data.trades = results[1];

        // render view
        res.render('portfolio/trades', {
            data: data
        });

    })
    .catch(err => {
        console.log('Error reading database: ', err);
    })

}

