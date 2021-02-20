const models = require('../../models');
const Trade = models.Trade;
const Operation = models.Operation;
const Moex = require('../../lib/moex');

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
                            newRecord['group'] = 'ETF';
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

console.log('TRADE',trade);

        if (!trade.id || trade.id == '') {
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

exports.list = (req, res, next) => {

    const portfolioId = req.params.id;

    if (!portfolioId) {
        res.status(404).json({
            error: 'Portfolio is not selected'
        });
        return next();
    }

    Trade.findAll({
            where: {
                portfolioId: portfolioId
            },
            include: [
                {
                    model: Operation,
                    as: 'operation',
                    attributes: ['title'],
                    required: false   // LEFT JOIN
                }
            ],
            order: [
                ['date', 'DESC']
            ],
            raw: true
    })
    .then(results => {

        results.forEach(result => {
            result['operation'] = {};
            result.operation['title'] = result['operation.title'];
        });

        // send json
        res.json({
            trades: results
        });
//        return next();
    })
    .catch(err => {
        console.log('Error reading database: ', err);
        res.json({
            error: err
        })
//        return next(err);
    })
}

exports.getSecids = (req, res, next) => {

    getSecurities()
    .then(securities => {
        res.json({
            securities: securities
        });
//        return next();
    })
    .catch(err => {
        res.json({
            error: err
        });
//        return next();
    });

}

exports.save = (req, res, next) => {

    const trade = req.body;
    delete trade.createdAt;
    delete trade.updatedAt;
    delete trade.PortfolioId;
    delete trade['operation.title'];
    delete trade.operation;
    trade.date = trade.date ? trade.date.slice(0,10) : new Date().toISOString().slice(0,10);

    const portfolioId = trade.portfolioId;

    if (!portfolioId) {
        res.json({
            error: 'Portfolio is not selected'
        });
        return next();
    }

    findTrade(trade)
    .then(result => {
        return saveTrade(result, trade, portfolioId);
    })
    .then(() => {
        console.log('Trade saved successfully.');
        res.json({
            message: 'Trade saved successfully.'
        });
    })
    .catch(err => {
        console.log(err);
        res.json({
            error: err
        });    
    });

}

exports.delete = (req, res, next) => {

    const {id} = req.body;

    if (!id) {
        res.json({
            message: 'Trade is not selected'
        });
        return next();
    }

    if (id != '') {
        Trade.destroy({
            where: {
                id: parseInt(id)
            }
        })
        .then(rowDeleted => {
            if (rowDeleted > 0) {
                console.log(`Trade deleted successfully.`);
                res.json({
                    message: 'Trade deleted'
                });
            }
        })
        .catch(err => {
            console.log('Error deleting record:', err);
            res.json({
                error: err
            });
            
        });

    }
} // delete