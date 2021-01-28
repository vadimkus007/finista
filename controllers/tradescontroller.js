const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;
const Operation = models.Operation;
const Moex = require('../lib/moex');

var exports = module.exports = {}

var getSecurities = function() {

    const urls = [
        'http://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME',
        'http://iss.moex.com/iss/engines/stock/markets/foreignshares/boards/FQBR/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME',
        'http://iss.moex.com/iss/engines/stock/markets/shares/boards/TQTF/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME',
        'http://iss.moex.com/iss/engines/stock/markets/bonds/boardgroups/58/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME'
    ];

    let promises = urls.map(index => Moex.fetchJSON(index));
    return new Promise((resolve, reject) => {
        Promise.all(promises)
        .then(results => {
            let data = [];
            for (var i = 0; i<results.length; i++) {
                results[i].securities.data.forEach(record => {
                    let newRecord = {};
                    newRecord['secid'] = record[0];
                    newRecord['name'] = record[1];
                    switch (i) {
                        case 2:
                            newRecord['group'] = 'ETF/ПИФ';
                            break;
                        case 3:
                            newRecord['group'] = 'Облигация';
                            break;
                        default:
                            newRecord['group'] = 'Акция';
                            break;
                    }
                    data.push(newRecord);
                });
            }
            resolve(data);
        })
        .catch(err => {
            console.log(err);
            reject(err);
        });
    });
}

// find trade
var findTrade = function(trade) {
    return new Promise((resolve, reject) => {
        if (trade.id == '') {
            resolve(false);
        } else {
            Trade.findOne({
                where: {
                    id: parseInt(trade.id)
                },
                raw: true
            })
            .then(found => {
                if (found) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            })
            .catch(err => {
                reject(err);
            })
        }
    })
} // findTrade

var createTrade = function(trade, portfolioId) {
    return Trade.create({
        portfolioId: parseInt(portfolioId),
        operationId: parseInt(trade.operationId),
        secid: trade.secid,
        price: trade.price,
        amount: parseInt(trade.amount),
        date: trade.date,
        comment: trade.comment,
        comission: (trade.comission === '') ? 0 : trade.comission,
        value: trade.value,
        accint: trade.accint,
        group: trade.group
    });
}; // createTrade

var updateTrade = function(trade, portfolioId) {
    return Trade.update({
        portfolioId: parseInt(portfolioId),
        operationId: parseInt(trade.operationId),
        secid: trade.secid,
        price: trade.price,
        amount: parseInt(trade.amount),
        date: trade.date,
        comment: trade.comment,
        comission: (trade.comission === '') ? 0 : trade.comission,
        value: trade.value,
        accint: trade.accint,
        group: trade.group
    }, {
        where: {
            id: trade.id
        }
    });
} // updateTrade

var getGroup = function(trade) {
    return new Promise((resolve, reject) => {
        Moex.getSecurityGroup(trade.secid)
        .then(result => {
            var group = null;
            if (result) {

                switch(result.group) {
                    case 'stock_shares':
                        group = 'Акция';
                        break;
                    case 'stock_dr':
                        group = 'Депозитарная расписка';
                        break;
                    case 'stock_etf':
                        group = 'ETF';
                        break;
                    case 'stock_ppif':
                        group = 'ПИФ';
                        break;
                    case 'stock_bonds':
                        group = 'Облигация';
                        break;
                    case 'stock_index':
                        group = 'index';
                        break;
                }
            }
            trade.group = group;
            resolve(trade);
        })
        .catch(err => reject(err));
    });
}

var saveTrade = function(result, trade, portfolioId) {

    if (result) {
        return getGroup(trade).then(trade => updateTrade(trade, portfolioId));
    } else {
        return getGroup(trade).then(trade => createTrade(trade, portfolioId));
    }
} // saveTrade


exports.action = (req, res, next) => {

    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }

    var user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    }

    const portfolioId = req.session.portfolio.id;

    switch (req.body.action) {

        case 'save':

            findTrade(req.body)
            .then(result => {
                return saveTrade(result, req.body, portfolioId);
            })
            .then(() => {
                console.log('Trade saved successfully.');
                res.redirect('/portfolio/trades');
            })
            .catch(err => {
                console.log(err);
                
                var data = {};
                data.portfolio = req.session.portfolio;
                data.trade = req.body;
                data.isNew = false;

                Operation.findAll({
                    raw: true
                })
                .then(operations => {
                    data.operations = operations;
                    return getSecurities();
                })
                .then(securities => {
                    data.securities = securities;

                    res.render('portfolio/trade-edit', {
                        user: user,
                        data: data,
                        error: err
                    });   

                })
                .catch(err=> {
                    console.log(err);
                });
            });
                
            break;

        case 'edit':

            var data = {};
            var promises = [];
            var func = [];
            
            if (req.body.id) {

                // EDIT form


                func = Trade.findOne({
                    where: {id: parseInt(req.body.id)},
                    raw: true
                });
                promises.push(func); // trade -> [0]

                func = Operation.findAll({
                    raw: true
                });
                promises.push(func); // operations -> [1]

                // perform database search
                Promise.all(promises)
                .then(result => {
                    data.portfolio = req.session.portfolio;
                    data.trade = result[0];

                    data.operations = result[1];
                    data.isNew = false;

                    return getSecurities();

                })
                .then(securities => {
                    data.securities = securities;
                    // render view
                    res.render('portfolio/trade-edit', {
                        user: user,
                        data: data
                    }); 
                })
                .catch(err => {
                    console.log('Error reading database: ', err);
                    next(err);
                });

            } else {

                // CREATE form
                data.portfolio = req.session.portfolio;
                Operation.findAll({
                    raw: true
                })
                .then(operations => {
                    data.operations = operations;
                    data.isNew = true;

                    return getSecurities();
                })
                .then(securities => {
                    data.securities = securities;
                    // render view
                    res.render('portfolio/trade-edit', {
                        user: user,
                        data: data
                    });
                })
                .catch(err => {
                    console.log('Error reading database: ', err);
                    next(err);
                });
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
                .catch(err => {
                    console.log('Error deleting record:', err);
                    next(err);
                });

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

    var user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    }

    var data = {};

    data.portfolio = req.session.portfolio;

    var promises = [];

    func = Trade.findAll({
            where: {
                portfolioId: req.session.portfolio.id
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
        data.trades = results[0];

//console.log('data.trades', data.trades);

        // render view
        res.render('portfolio/trades', {
            user: user,
            data: data
        });

    })
    .catch(err => {
        console.log('Error reading database: ', err);
        next(err);
    })

}

exports.import = (req, res, next) => {

    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }

    var user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    }

    var data = {};
    data.portfolio = req.session.portfolio;


    // render view
    res.render('portfolio/import', {
        user: user,
        data: data
    });

}

