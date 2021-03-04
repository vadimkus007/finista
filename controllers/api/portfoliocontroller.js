const models = require('../../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;
const Moex = require('../../lib/moex');
const LibPortfolio = require('../../lib/portfolio');

const sequelize = require('sequelize');
const Op = sequelize.Op;

var moment = require('moment');
var Finance = require('financejs');
var finance = new Finance;

var exports = module.exports = {};

// get Portfolio

// getRubs
const getRubs = function(id, currency) {
        return Trade.findAll({
                    attributes: [
                        'date',
                        'operationId',
                        'price',
                        'amount',
                        'comission' 
                    ],
                    where: {
                        portfolioId: id,
                        secid: currency
                    },
                    raw: true
        });
}; // getRubs

// get history data on one security
    // secid = {secid: value, boardid: value, market: value, engine: value}
    const getHistory = function(secid, startDate, endDate) {
        return new Promise((resolve, reject) => {
            // days difference
            var date1 = moment(startDate, 'YYYY-MM-DD');
            var date2 = moment(endDate, 'YYYY-MM-DD');
            var daysDiff = date2.diff(date1, 'days');

            let urls = [];
            for (var i = 0; i<daysDiff; i=i+100) {
                let url = `https://iss.moex.com/iss/history/engines/${secid.engine}/markets/${secid.market}/boards/${secid.boardid}/securities/${secid.secid}.json?iss.meta=off&from=${startDate}&till=${endDate}&start=${i}&history.columns=SECID,TRADEDATE,CLOSE`;
                urls.push(url);
            }
            let promises = urls.map(index => Moex.fetchJSON(index));
            Promise.all(promises)
            .then(results => {
                let arr = [];
                results.forEach(result => {
                    arr = arr.concat(result.history.data);
                });
                resolve(arr);
            })
            .catch(err => reject(err));

        });
    } // getHistory

// get array of histories for all secids
    // secids = [{secid: value, boardid: value, market: value, engine: value}]
const getHistories = (secids, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        let promises = secids.map(secid => getHistory(secid, startDate, endDate));
        Promise.all(promises)
        .then(history => {
            resolve(history);
        })
        .catch(err => reject(err));
    });
} // getHistories

const getSecids = (portfolioId, date) => {

    return Trade.findAll({
        where: {
                    portfolioId: portfolioId
                },
        raw: true
    });
}

const findPrice = (history, secid, date) => {

                let arr = history.find((element, index, array) => {
                    if (element[0][0] === secid) {
                        return true;
                    } else {
                        return false;
                    }
                });
                let price = arr.find((element, index, array) => {
                    if (element[1] === date) {
                        return true;
                    } else {
                        return false;
                    }
                });
                if (price) {
                    return price[2];
                } else {
                    return 0;
                }
} // findPrice

const getSecuritiesAmount = (trades, ignore, date) => {
    let obj = {};
    trades.forEach(trade => {
        if (new Date(trade.date) <= new Date(date)) {
            if (trade.secid !== ignore) {
                if (!obj[trade.secid]) {
                    obj[trade.secid] = {
                        amount: 0
                    };
                };
                if (trade.operationId === 1 || trade.operationId === 7) {
                    obj[trade.secid].amount += trade.amount;
                };
                if (trade.operationId === 2 || trade.operationId === 4 || trade.operationId === 8) {
                    obj[trade.secid].amount -= trade.amount;
                };
            }
        }
    });
    return obj;
} // getSecuritiesAmount

const getCashe = (trades, secid, date) => {
    var _cashe = 0;
    trades.forEach(trade => {
        if (new Date(trade.date) <= new Date(date)) {
            switch(trade.operationId) {
                        case 1:
                            if (trade.secid === secid) {
                                _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            } else {
                                _cashe = _cashe - Number(trade.price*trade.amount) - Number(trade.comission);
                            }
                            break;
                        case 2:
                            if (trade.secid === secid) {
                                _cashe = _cashe - Number(trade.price*trade.amount) - Number(trade.comission);
                            } else {
                                _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            }
                            break;
                        case 3:
                            if (trade.secid !== secid) {
                                _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            }
                            break;
                        case 4:
                            _cashe = _cashe + Number(trade.price*trade.amount*trade.value/100) - Number(trade.comission);
                            break;
                        case 5:
                            _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            break;
                        case 6:
                            _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            break;
                        case 7:
                            _cashe = _cashe - Number(trade.value*trade.price*trade.amount/100) - Number(trade.accint*trade.amount) - Number(trade.comission);
                            break;
                        case 8:
                            _cashe = _cashe + Number(trade.value*trade.price*trade.amount/100) - Number(trade.accint*trade.amount) - Number(trade.comission);
                            break;

            }
        }
    });
    return _cashe;
} // getCashe

exports.actives = (req, res, next) => {
    
        const portfolioId = req.params.id;
        if (!portfolioId) {
            res.status(404).json({
                error: 'Portfolio is not selected'
            });
            return next();
        };

        var portfolio = {id: portfolioId};

        var data = {};
        var securities = {};

        var startDate;
        var endDate = moment().format('YYYY-MM-DD');

        Portfolio.findOne({
            where: {
                id: portfolio.id
            },
            raw: true
        })
        .then(result => {

            data.portfolio = {...portfolio, ...result};

            startDate =  moment(data.portfolio.dateopen).format('YYYY-MM-DD');

            return LibPortfolio.getTrades(data.portfolio.id);
        })
        .then(results => {

            data.trades = results;
            data.portfolio.cashe = 0;

            let emptySecurity = {
                amount: 0,
                buy: 0
            };

            data.trades.forEach(trade => {

                switch (trade.operationId) {
                    case 1:
                        if (trade.secid === data.portfolio.currency) {
                            data.portfolio.cashe = data.portfolio.cashe+Number(trade.price*trade.amount) - Number(trade.comission);
                        } else {
                            if (!securities[trade.secid]) { 
                                securities[trade.secid] = {
                                    amount: 0,
                                    buy: 0,
                                    sell: 0,
                                    dividends: 0,
                                    group: trade.group,
                                    meanPrice: 0
                                };
                            };
                            data.portfolio.cashe = Number(data.portfolio.cashe) - Number(trade.price*trade.amount) - Number(trade.comission);
                            securities[trade.secid].amount = Number(securities[trade.secid].amount) + Number(trade.amount);
                            securities[trade.secid].buy = Number(securities[trade.secid].buy) + Number(trade.price*trade.amount) + Number(trade.comission);
                            securities[trade.secid].meanPrice = Number(securities[trade.secid].buy) / Number(securities[trade.secid].amount);
                        }
                        break;
                    case 2:
                        if (trade.secid === data.portfolio.currency) {
                            data.portfolio.cashe = data.portfolio.cashe-Number(trade.price*trade.amount) - Number(trade.comission);
                        } else {
                            data.portfolio.cashe = Number(data.portfolio.cashe) + Number(trade.price*trade.amount) - Number(trade.comission);
                            securities[trade.secid].amount = Number(securities[trade.secid].amount) - Number(trade.amount);
                            securities[trade.secid].sell = securities[trade.secid].sell + Number(trade.price*trade.amount) - Number(trade.comission);
                        }
                        break;
                    // Dividends
                    case 3:
                        data.portfolio.cashe = Number(data.portfolio.cashe) + Number(trade.price*trade.amount) - Number(trade.comission);
                        securities[trade.secid].dividends = Number(securities[trade.secid].dividends) + Number(trade.price*trade.amount) - Number(trade.comission);
                        break;
                    // Погашение облигаций
                    case 4:
                        data.portfolio.cashe = Number(data.portfolio.cashe) + Number(trade.price*trade.amount) - Number(trade.comission);
                        securities[trade.secid].amount = securities[trade.secid].amount - Number(trade.amount);
                        securities[trade.secid].sell = securities[trade.secid].sell + Number(trade.price*trade.amount) - Number(trade.comission);
                        break;
                    // Coupone
                    case 5:
                        data.portfolio.cashe = Number(data.portfolio.cashe) + Number(trade.price*trade.amount) - Number(trade.comission);
                        securities[trade.secid].dividends = securities[trade.secid].dividends + Number(trade.price*trade.amount) - Number(trade.comission);
                        break;
                    // Амортизация
                    case 6:
                        data.portfolio.cashe = Number(data.portfolio.cashe) + Number(trade.price*trade.amount) - Number(trade.comission);
                        break;
                    // Buy of bonds
                    case 7:
                        if (!securities[trade.secid]) { 
                                securities[trade.secid] = {
                                    amount: 0,
                                    buy: 0,
                                    sell: 0,
                                    dividends: 0,
                                    group: trade.group
                                };
                        };
                        data.portfolio.cashe = data.portfolio.cashe - Number(trade.amount*trade.value*trade.price/100) - Number(trade.accint) - Number(trade.comission);
                        securities[trade.secid].amount = securities[trade.secid].amount + Number(trade.amount);
                        securities[trade.secid].buy = securities[trade.secid].buy + Number(trade.amount*trade.value*trade.price/100) + Number(trade.accint) + Number(trade.comission);
                        securities[trade.secid].meanPrice = Number(securities[trade.secid].buy) / Number(securities[trade.secid].amount);
                        break;
                    // Sell of bond
                    case 8:
                        data.portfolio.cashe = data.portfolio.cashe + Number(trade.amount*trade.value*trade.price/100) - Number(trade.accint) - Number(trade.comission);
                        securities[trade.secid].amount = securities[trade.secid].amount - Number(trade.amount);
                        securities[trade.secid].sell = securities[trade.secid].sell + Number(trade.amount*trade.value*trade.price/100) - Number(trade.accint) - Number(trade.comission);
                        break;
                    default:
                        break;
                }

                
            }); // trades processing

            // get Moex data
            // get primary boards
            let promises = [];
            for (var key in securities) {
                promises.push(Moex.getPrimaryBoard(key));
            };

            return Promise.all(promises);

        })
        .then(results => {

            results.forEach(row => {
                securities[row.secid] = {...securities[row.secid], ...row};
            });

            // get marketdata 
            let promises = [];

            for (var key in securities) {
                let request = {
                        engines: securities[key].engine,
                        markets: securities[key].market,
                        boards: securities[key].boardid,
                        securities: key
                };
                let options = {
                        'iss.only': 'securities,marketdata',
                        'securities.columns': 'SECID,SHORTNAME',
                        'marketdata.columns': 'LAST,LASTTOPREVPRICE,CHANGE'
                };
                promises.push(Moex.getRequest(request, options));
            };

            return Promise.all(promises);
        })
        .then(results => {

            results.forEach(row => {
                securities[row.securities[0].SECID] = {...securities[row.securities[0].SECID], 
                                                        ...row.securities[0], 
                                                        ...row.marketdata[0]};
            });

            // calculate portfolio params

            data.portfolio.shares = {cost: 0, profit: 0, change: 0, changePrc: 0};
            data.portfolio.etf = {cost: 0, profit: 0, change: 0, changePrc: 0};
            data.portfolio.bonds = {cost: 0, profit: 0, change: 0, changePrc: 0};

            data.shares = [];
            data.etf = [];
            data.bonds = [];

            for (var key in securities) {
                let row = securities[key];
                if (row.group === 'Акция' || row.group === 'Депозитарная расписка') {
                    row.group = 'shares';
                }
                if (row.group === 'ПИФ' || row.group === 'ETF') {
                    row.group = 'etf';
                }
                if (row.group === 'Облигация') {
                    row.group = 'bonds';
                }
                row.last = row.LAST;
                row.cost = (row.group == 'bonds') ? Number(row.last*row.value*row.amount/100) : Number(row.last*row.amount);
                row.profit = Number(row.sell) + Number(row.cost) + Number(row.dividends) - Number(row.buy);
                row.exchangeProfit = (row.group == 'bonds')
                    ? (row.last - row.meanPrice) * row.amount * row.value / 100
                    : (row.last - row.meanPrice) * row.amount;
                row.exchangeProfitPrc = 100 * row.exchangeProfit / row.buy;
                row.change = row.CHANGE * row.amount;
                row.changePrc = row.LASTTOPREVPRICE;

                // delete unused rows

                // add to portfolio
                switch (row.group) {
                    case 'shares':
                        data.portfolio.shares.cost += row.cost;
                        data.portfolio.shares.profit += row.profit;
                        data.portfolio.shares.change += row.change;

                        data.shares.push(row);

                        break;
                    case 'etf':
                        data.portfolio.etf.cost += row.cost;
                        data.portfolio.etf.profit += row.profit;
                        data.portfolio.etf.change += row.change;

                        data.etf.push(row);

                        break;
                    case 'bonds':
                        data.portfolio.bonds.cost += row.cost;
                        data.portfolio.bonds.profit += row.profit;
                        data.portfolio.bonds.change += row.change;

                        data.bonds.push(row);

                        break;
                    default:
                        break;
                }
            }

            data.portfolio.cost = Number(data.portfolio.shares.cost) + Number(data.portfolio.etf.cost) + Number(data.portfolio.bonds.cost) + Number(data.portfolio.cashe);
            data.portfolio.profit = Number(data.portfolio.shares.profit) + Number(data.portfolio.etf.profit) + Number(data.portfolio.bonds.profit);
            data.portfolio.change = Number(data.portfolio.shares.change) + Number(data.portfolio.etf.change) + Number(data.portfolio.bonds.change);
            data.portfolio.changePrc = 100 * data.portfolio.change / data.portfolio.cost;

            data.portfolio.shares.changePrc = 100 * data.portfolio.shares.change / data.portfolio.shares.cost;
            data.portfolio.etf.changePrc = 100 * data.portfolio.etf.change / data.portfolio.etf.cost;
            data.portfolio.bonds.changePrc = 100 * data.portfolio.bonds.change / data.portfolio.bonds.cost;

            // Percentage
            data.portfolio.shares.percentage = 100 * data.portfolio.shares.cost / data.portfolio.cost;
            data.portfolio.etf.percentage = 100 * data.portfolio.etf.cost / data.portfolio.cost;
            data.portfolio.bonds.percentage = 100 * data.portfolio.bonds.cost / data.portfolio.cost;
            data.portfolio.cashePercentage = 100 * data.portfolio.cashe / data.portfolio.cost;

            // calculate percentage for securities types
            data.shares.forEach(row => {
                row.percentage = 100 * row.cost / data.portfolio.shares.cost;
            });
            data.etf.forEach(row => {
                row.percentage = 100 * row.cost / data.portfolio.etf.cost;
            });
            data.bonds.forEach(row => {
                row.percentage = 100 * row.cost / data.portfolio.bonds.cost;
            });

            // xirr
            return getRubs(data.portfolio.id, data.portfolio.currency);
        })
        .then(rubs => {

            let sum = [];
            let d = [];

            rubs.forEach(rub => {
                if (rub.operationId == 1) {
                    sum.push(Number(rub.comission) - (Number(rub.price) * Number(rub.amount)));
                    d.push(rub.date);
                } else if (rub.operationId == 2) {
                    sum.push((Number(rub.price) * Number(rub.amount)) - Number(rub.comission));
                    d.push(rub.date);
                };
            });
                
            sum.push(data.portfolio.cost);
            d.push(new Date());

            // XIRR 
            var rate = 0;
            if (sum.length > 1) {
                rate = finance.XIRR(sum, d, 0);
            };

            data.portfolio.xirr = Number(rate).toFixed(2);


            // get history price of portfolio ******************************************************

            

            let secids = [];
            for (var key in securities) {
                let row = securities[key];
                let request = {
                    secid: row.secid,
                    boardid: row.boardid,
                    market: row.market,
                    engine: row.engine
                };
                secids.push(request);
            };

            return getHistories(secids, startDate, endDate);
        })
        .then(results => {

            var history = results;
            // extract dates from history request
            var dates = [];
            history[0].forEach(row => {
                dates.push(row[1]);
            });

            let amount = [];

            dates.forEach(d => {
                let sec = getSecuritiesAmount(data.trades, data.portfolio.currency, d);
                let price = 0;
                for (var key in sec) {
                     let p = findPrice(history, key, d);
                     price += sec[key].amount * p;
                };
                let cashe = getCashe(data.trades, data.portfolio.currency, d);
                price += cashe;
                amount.push([
                    Date.parse(d),
                    price
                ]);
            });

            data.history = amount;

// console.log(amount);

            // console.log(getSecuritiesAmount(data.trades, '2021-02-20'));

// console.log('dates', dates);
// console.log('historyObj', historyObj);
// console.log('RESULTS', results);

            res.json({
                data
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });

} // actives