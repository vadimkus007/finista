const models = require('../../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;
const Moex = require('../../lib/moex');
const LibPortfolio = require('../../lib/portfolio');

var moment = require('moment');
var Finance = require('financejs');
var finance = new Finance;

var exports = module.exports = {};

const getPrice = (history, secid, date) => {

    function findDate(element, index, array) {
        return (moment(element.TRADEDATE) >= moment(date)) ? true : false;
    } // findDate

    let array = history.find((element) => {
        return (element[0].SECID === secid) ? true : false;
    });

    if (date === array[0].TRADEDATE) {
        return array[0].CLOSE;
    }

    let index = array.findIndex(findDate);
    if (index === -1) {
        return array[array.length-1].CLOSE;
    }

    if (array[index].TRADEDATE === date) {
        return array[index].CLOSE;
    } else {
        return array[index-1].CLOSE;
    }
} // getPrice

// Annual Average Geometrical Rate
const AAGR = function(amount, time) {
    var weights = []; // wight
    var periods = [];
    // check arguments
    if (time.length !== amount.length) {return 0};
    if (amount.length < 2) {return 0};
    var startIndex = 0;
    var endIndex = amount.length - 1;
    // calculate periods
    for (var i = 0; i<amount.length; i++) {
        let per = moment.duration(moment(time[endIndex]).diff(moment(time[i]))).asDays();
        periods.push(per);
    } // !!!
    // calculate weights
    for (var i = 0; i<amount.length; i++) {
        weights[i] = periods[i]/periods[startIndex]; // just annual profit
    }
    // cashe flows 
    var s = 0;
    var avS = 0
    for (i = 0; i<amount.length;i++) {
        s = s + Number(amount[i]);
        if (i>startIndex && i<endIndex) {
            avS = Number(avS) + Number(weights[i]) * Number(amount[i]);
        }
    }

    var profit = -s/(amount[startIndex] + avS);
    profit = 100* profit * 365 / periods[startIndex];

    return Number(profit).toFixed(2);
} // AAGR

exports.info = (req, res, next) => {
    const user = req.user.dataValues;

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
    var endDate = moment();
    var periods = [];

    Portfolio.findOne({
            where: {
                id: portfolio.id
            },
            raw: true
    })
    .then(portfolio => {
        data.portfolio = portfolio;

        // calculate periods
        startDate = moment(portfolio.dateopen);
        let duration = moment.duration(endDate.diff(startDate));
        let days = Math.round(duration.asDays());

        // all periods
        periods.push({
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            title: 'Весь период'
        });

        for (var year = moment(startDate).format('YYYY'); year <= moment(endDate).format('YYYY'); year++) {
            let start = '';
            let end = '';
            if (year === moment(startDate).format('YYYY')) {
                start = moment(startDate).format('YYYY-MM-DD');
                end = year+'-12-31';
            } else if (year === moment(endDate).format('YYYY')) {
                start = year + '-01-01';
                end = moment(endDate).format('YYYY-MM-DD');
            } else {
                start = year + '-01-01';
                end = year + '-12-31';
            }
            let obj = {
                startDate: start,
                endDate: end,
                title: String(year)
            }
            periods.push(obj);
        };

        // get start cashe
        let promises = [];
        periods.forEach(period => {
            promises.push(LibPortfolio.getCashe(data.portfolio.id, period.startDate));
        });

        return Promise.all(promises);
    })
    .then(startCashe => {
        for (var i = 0; i < periods.length; i++) {
            periods[i].startCashe = startCashe[i].cashe;
            if (periods[i].startDate === moment(startDate).format('YYYY-MM-DD')) {
                periods[i].startCashe = 0;
            }
        }

        // get endCashe
        let promises = [];
        periods.forEach(period => {
            promises.push(LibPortfolio.getCashe(data.portfolio.id, period.endDate));
        });

        return Promise.all(promises);
    })
    .then(endCashe => {
        for (var i = 0; i < periods.length; i++) {
            periods[i].endCashe = endCashe[i].cashe;
        }

        // get securities start date
        let promises = [];
        periods.forEach(period => {
            promises.push(LibPortfolio.getSecids(data.portfolio.id, period.startDate));
        });

        return Promise.all(promises);
    })
    .then(startSecids => {
        for (var i = 0; i < periods.length; i++) {
            periods[i].startSecurities = startSecids[i];
            if (periods[i].startDate === moment(startDate).format('YYYY-MM-DD')) {
                periods[i].startSecurities = [];
            }
        }

        // get securities end date
        let promises = [];
        periods.forEach(period => {
            promises.push(LibPortfolio.getSecids(data.portfolio.id, period.endDate));
        });

        return Promise.all(promises);
    })
    .then(endSecurities => {
        for (var i = 0; i < periods.length; i++) {
            periods[i].endSecurities = endSecurities[i];
        }

        // get securities amount on start date
        let promises = [];
        periods.forEach(period => {
            promises.push(LibPortfolio.getSecidsAmount(data.portfolio.id, period.startSecurities, period.startDate));
        });

        return Promise.all(promises);
    })
    .then(amounts => {
        for (var i = 0; i < amounts.length; i++) {
            let amount = amounts[i];
            amount.forEach(row => {
                let secids = periods[i].startSecurities;
                secids.forEach(secid => {
                    if (secid.secid === row.secid) {
                        secid.amount = row.amount;
                    }
                });
            });
        };

        // get securities amount on end date

        let promises = [];
        periods.forEach(period => {
            promises.push(LibPortfolio.getSecidsAmount(data.portfolio.id, period.endSecurities, period.endDate));
        });

        return Promise.all(promises);
    })
    .then(amounts => {

        for (var i = 0; i < amounts.length; i++) {
            let amount = amounts[i];
            amount.forEach(row => {
                let secids = periods[i].endSecurities;
                secids.forEach(secid => {
                    if (secid.secid === row.secid) {
                        secid.amount = row.amount;
                    }
                });
            });
        };

        // get all secids in portfolio secids

        return LibPortfolio.getSecids(data.portfolio.id);
    })
    .then(secids => {


        // get histories
        let promises = [];
        secids.forEach(secid => {
            promises.push(Moex.getHistory(secid.secid, moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')));
        });

        return Promise.all(promises);
    })
    .then(history => {
        data.history = history;

        // calculate start balance for each period
        periods.forEach(period => {
            let cost = 0;
            period.startSecurities.forEach(row => {
                cost += getPrice(data.history, row.secid, period.startDate) * row.amount;
            });
            period.startBalance = Number(cost) + Number(period.startCashe);
        });
        periods.forEach(period => {
            let cost = 0;
            period.endSecurities.forEach(row => {
                cost += getPrice(data.history, row.secid, period.endDate) * row.amount;
            });
            period.endBalance = Number(cost) + Number(period.endCashe);
        });

        // get income for periods
        let promises = [];
        for (var i = 1; i < periods.length; i++) {
            promises.push(LibPortfolio.getIncomeYear(data.portfolio.id, moment(periods[i].endDate).format('YYYY')));
        }

        return Promise.all(promises);
    })
    .then(incomes => {

        periods[0].income = 0;
        for (var i = 0; i < incomes.length; i++) {
            periods[i+1].income = Number(incomes[i][0].income);
            periods[0].income += Number(incomes[i][0].income);
        }

        // get outcome for periods
        let promises = [];
        for (var i = 1; i < periods.length; i++) {
            promises.push(LibPortfolio.getOutcomeYear(data.portfolio.id, moment(periods[i].endDate).format('YYYY')));
        }

        return Promise.all(promises);
    })
    .then(outcomes => {

        periods[0].outcome = 0;
        for (var i = 0; i < outcomes.length; i++) {
            periods[i+1].outcome = Number(outcomes[i][0].outcome);
            periods[0].outcome += Number(outcomes[i][0].outcome);
        }

        // get comission for periods
        let promises = [];
        for (var i = 1; i < periods.length; i++) {
            promises.push(LibPortfolio.getComissionYear(data.portfolio.id, moment(periods[i].endDate).format('YYYY')));
        }

        return Promise.all(promises);
    })
    .then(comission => {

        periods[0].comission = 0;
        for (var i = 0; i < comission.length; i++) {
            periods[i+1].comission = Number(comission[i][0].comission);
            periods[0].comission += Number(comission[i][0].comission);
        }

        // get dividends
        let promises = [];
        promises.push(LibPortfolio.getDividends(data.portfolio.id));
        for (var i = 1; i < periods.length; i++) {
            promises.push(LibPortfolio.getDividendsYear(data.portfolio.id, moment(periods[i].endDate).format('YYYY')));
        }

        return Promise.all(promises);
    })
    .then(dividends => {

        for (var i = 0; i < periods.length; i++) {
            periods[i].dividends = Number(dividends[i][0].dividends) || 0;
        }

        // calculate PL
        for (var i = 0; i < periods.length; i++) {
            periods[i].PL = Number(periods[i].endBalance) - Number(periods[i].startBalance) - Number(periods[i].income) + Number(periods[i].outcome);
        }

        // get Rubs fro XIRR calculation

        return LibPortfolio.getRubs(data.portfolio.id);
    })
    .then(rubs => {

        console.log(rubs);

        // calculate XIRR
        for (var i = 0; i < periods.length; i++) {
            let period = periods[i];
            let sum = [];
            let d = [];
            // start of period
            sum.push(-period.startBalance);
            d.push(new Date(period.startDate));

            rubs.forEach(rub => {
                if (moment(rub.date) >= moment(period.startDate) && moment(rub.date) <= moment(period.endDate)) {
                    if (rub.operationId == 1) {
                        sum.push(Number(rub.comission) - (Number(rub.price) * Number(rub.amount)));
                        d.push(rub.date);
                    } else if (rub.operationId == 2) {
                        sum.push((Number(rub.price) * Number(rub.amount)) - Number(rub.comission));
                        d.push(rub.date);
                    };
                }
            });
            
            // end of period
            sum.push(period.endBalance);
            d.push(new Date(period.endDate));

            let rate = 0;
            if (sum.length > 1) {
                rate = finance.XIRR(sum, d, 0);
            } else {
                rate = 0;
            };

            period.profit = rate;
        } // XIRR

        // prepare secids list

        for (var i = 0; i < periods.length; i++) {
            let period = periods[i];
            let securities = {};
            period.startSecurities.forEach(secid => {
                securities[secid.secid] = {secid: secid.secid};
            });
            period.endSecurities.forEach(secid => {
                securities[secid.secid] = {secid: secid.secid};
            });

            period.securities = [];
            for (var key in securities) {
                period.securities.push({secid: key, sum: [], time: []});
            }
        }

        // get operation for secids by the year
        let promises = [];
        promises.push(LibPortfolio.getSecidsOperations(data.portfolio.id, periods[0].securities));
        for (var i = 1; i < periods.length; i++) {
            promises.push(LibPortfolio.getSecidsOperationsYear(data.portfolio.id, periods[i].securities, moment(periods[i].endDate).format('YYYY')));
        }

        return Promise.all(promises);
    })
    .then(operations => {


        // process operations to calc xirr
        for (var i = 0; i < periods.length; i++) {
            let period = periods[i];
            let operation = operations[i];
//console.log(i, operation);
            operation.forEach(secids => {
                secids.forEach(secid => {
                    let ticker = secid.secid;
                    let security = period.securities.find((element) => {
                        return (element.secid === ticker) ? true : false;
                    });
                    let sum = security.sum;
                    let time = security.time;

                    switch(secid.operationId) {
                        case 1:
                            sum.push(secid.comission - secid.amount*secid.price);
                            time.push(new Date(secid.date));
                            break;
                        case 2:
                            sum.push(secid.amount*secid.price - secid.comission);
                            time.push(new Date(secid.date));
                            break;
                        case 3:
                            sum.push(secid.amount*secid.price - secid.comission);
                            time.push(new Date(secid.date));
                            break;
                        case 4:
                            sum.push(secid.amount*secid.price*secid.amount/100 - secid.comission);
                            time.push(new Date(secid.date));
                            break;
                        case 5:
                            sum.push(secid.amount*secid.price - secid.comission);
                            time.push(new Date(secid.date));
                            break;
                        case 6:
                            sum.push(secid.amount*secid.price - secid.comission);
                            time.push(new Date(secid.date));
                            break;
                        case 7:
                            sum.push(-(secid.price*secid.amount*secid.value/100)-(secid.accint*secid.amount)-secid.comission);
                            time.push(new Date(secid.date));
                            break;
                        case 8:
                            sum.push((secid.price*secid.amount*secid.value/100)-secid.comission-(secid.accint*secid.amount));
                            time.push(new Date(secid.date));
                            break;
                        default:
                            break;
                    }
                });
                
            }); // operations

            // start values
            period.securities.forEach(security => {
                let sum = security.sum;
                let time = security.time;
                let ticker = security.secid;
                let obj = period.startSecurities.find((element) => {
                    return (element.secid === ticker) ? true : false;
                });
                if (typeof obj !== 'undefined') {
                    let cost = getPrice(data.history, ticker, period.startDate) * obj.amount;
                    sum.push(-cost);
                    time.push(new Date(period.startDate));
                }
                
            });

            // end values
            period.securities.forEach(security => {
                let sum = security.sum;
                let time = security.time;
                let ticker = security.secid;
                let obj = period.endSecurities.find((element) => {
                    return (element.secid === ticker) ? true : false;
                });
                if (typeof obj !== 'undefined') {
                    let cost = getPrice(data.history, ticker, period.endDate) * obj.amount;
                    sum.push(cost);
                    time.push(new Date(period.endDate));
                }
                
            });
        } // periods

        // calculate XIRR for secids
        for (var i = 0; i < periods.length; i++) {
            periods[i].securities.forEach(security => {
                let rate = finance.XIRR(security.sum, security.time, 0);
                // if XIRR is imposible to calculate use geometrical average value
                if (isNaN(rate)) {
                    rate = AAGR(amount, time);
                }
                security.profit = rate;

                delete security.sum;
                delete security.time;
            });

            delete periods[i].startSecurities;
            delete periods[i].endSecurities;
        }
        

        res.json({
            periods
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err.message});
    });

    
}