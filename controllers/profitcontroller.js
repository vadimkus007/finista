const Moex = require('../lib/moex');
const libPortfolio = require('../lib/portfolio');
const moment = require('moment');

var Finance = require('financejs');
var finance = new Finance;

var exports = module.exports = {}

/* getBoards
    secids = [{secid: NAME},...]
*/
const getBoards = function(secids) {
    let promises = [];

    secids.forEach(secid => {
        promises.push(Moex.getPrimaryBoard(secid.secid))
    });
    return Promise.all(promises);
}

// getPrices
const getPrices = function(boards, date) {

        let promises = [];
        boards.forEach(board => {
            promises.push(Moex.getPrice(board.secid, date));
        });

        return Promise.all(promises)

} //getPrices


exports.info = (req, res, next) => {

    // return to /portfolios to choose portfolio
    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }

    const portfolioId = req.session.portfolio.id;

    var data = {};

    libPortfolio.getPortfolio(portfolioId)
    .then(portfolio => {
        data.portfolio = portfolio;
        data.annual = [];
//        var years = [];
        for (var year = moment(portfolio.dateopen).format('YYYY'); year <= moment().format('YYYY'); year++) {
            
            data.annual.push({'year': String(year)});

//            years.push(String(year));
//            data[year] = {};
        }
//        data.years = years;

        // get cashe for eyear
        let promises = [];
        promises.push(libPortfolio.getCashe(portfolioId));
        data.annual.forEach(year => {
            promises.push(libPortfolio.getCashe(portfolioId, year.year + '-12-31')); // end of period
        });

        return Promise.all(promises)
    })
    .then(cashes => {
        data.cashe = Number(cashes[0].cashe);
        cashes.splice(0,1);

        for (var i = 0; i<data.annual.length; i++) {
//            data[data.years[i]].cashe = cashes[i].cashe;

            data.annual[i].cashe = cashes[i].cashe;
        }

        // get income values
        let promises = [];
        promises.push(libPortfolio.getIncomeYear(portfolioId));
        data.annual.forEach(year => {
            promises.push(libPortfolio.getIncomeYear(portfolioId, year.year));
        });

        return Promise.all(promises);
    })
    .then(incomes => {
        data.income = (incomes[0][0].income) ? Number(incomes[0][0].income) : 0.00;
        incomes.splice(0,1);
        for (var i = 0; i < incomes.length; i++) {
//            data[data.years[i]].income = incomes[i][0].income;

            data.annual[i].income = incomes[i][0].income;

        }

        // get outcome values
        let promises = [];
        promises.push(libPortfolio.getOutcomeYear(portfolioId));
        data.annual.forEach(year => {
            promises.push(libPortfolio.getOutcomeYear(portfolioId, year.year));
        });

        return Promise.all(promises);
    })
    .then(outcomes => {
        data.outcome = outcomes[0][0].outcome ? Number(outcomes[0][0].outcome) : 0.00;
        outcomes.splice(0,1);
        for (var i = 0; i < outcomes.length; i++) {
//            data[data.years[i]].outcome = outcomes[i][0].outcome;

            data.annual[i].outcome = (outcomes[i][0].outcome) ? outcomes[i][0].outcome : '0.00';
        }

        // get comissions
        // get outcome values
        let promises = [];
        promises.push(libPortfolio.getComissionYear(portfolioId));
        data.annual.forEach(year => {
            promises.push(libPortfolio.getComissionYear(portfolioId, year.year));
        });

        return Promise.all(promises)
    })
    .then(comissions => {
        data.comission = comissions[0][0].comission;
        comissions.splice(0,1);
        for (var i = 0; i < comissions.length; i++) {
//            data[data.years[i]].comission = comissions[i][0].comission;

            data.annual[i].comission = comissions[i][0].comission;

        }

        let promises = [];
        promises.push(libPortfolio.getTrades(portfolioId));
        data.annual.forEach(year => {
            promises.push(libPortfolio.getTradesYear(portfolioId, year.year)); 
        });

        return Promise.all(promises)
    })
    .then(trades => {
        data.trades = trades[0];
        trades.splice(0,1);
        for (var i = 0; i < trades.length; i++) {
//            data[data.years[i]].trades = trades[i];

            data.annual[i].trades = trades[i];

        }

        // get secids
        return libPortfolio.getSecids(portfolioId)
    })
    .then(secids => {
        data.secids = secids;

        return getBoards(data.secids);
    })
    .then(boards => {
        data.boards = boards;

        return getPrices(data.boards);
    })
    .then(prices => {
        data.prices = prices;

        // get Rubs for XIRR calculation
        return libPortfolio.getRubs(portfolioId);
    })
    .then(rubs => {
        data.rubs = rubs;

        // process new secids as {secidName: {}}
        let obj = {};
        data.secids.forEach(secid => {
            obj[secid.secid] = {};
            obj[secid.secid].secid = secid.secid;
            obj[secid.secid].amount = 0;
            obj[secid.secid].buy = 0;
            obj[secid.secid].sell = 0;
        });
        data.securities = obj;

        //calculate amount of securities
        data.trades.forEach(trade => {
            if (trade.secid !== data.portfolio.currency) {

                switch(trade.operationId) {
                    case 1: 
                        data.securities[trade.secid].amount = Number(data.securities[trade.secid].amount) + Number(trade.amount);
                        break;
                    case 2: 
                        data.securities[trade.secid].amount = Number(data.securities[trade.secid].amount) - Number(trade.amount);
                        break;
                }
            }
        });

        // calculate buy and sell prices for securities
        data.trades.forEach(trade => {
            if (trade.secid !== data.portfolio.currency) {
                switch(trade.operationId) {
                    case 1:
                        data.securities[trade.secid].buy = Number(data.securities[trade.secid].buy) + Number(trade.sum) + Number(trade.comission);
                        break;
                    case 2:
                        data.securities[trade.secid].sell = Number(data.securities[trade.secid].sell) + Number(trade.sum) - Number(trade.comission);
                        break;
                }
            }
        });

        // calculate prices for each secid
        data.prices.forEach(price => {
            data.securities[price.secid].price = Number(data.securities[price.secid].amount) * Number(price.price);
        });

        // Calculate dividends
        data.dividends = 0;
        data.trades.forEach(trade => {
            if (trade.operationId == 3) {
                data.dividends = data.dividends + Number(trade.sum) - Number(trade.comission);
            }
        });

        // Final balance
        data.securitiesPrice = 0;
        data.securitiesBuy = 0;
        data.securitiesSell = 0;
        for (key in data.securities) {
            data.securitiesBuy = Number(data.securitiesBuy) + Number(data.securities[key].buy);
            data.securitiesSell = Number(data.securitiesSell) + Number(data.securities[key].sell);
            data.securitiesPrice = Number(data.securitiesPrice) + Number(data.securities[key].price);
        };
        data.portfolioPrice = data.cashe + data.securitiesPrice;

        // calculate XIRR
        var sum = [];
        var time = [];
        data.rubs.forEach(rub => {
            if (rub.operationId == 1) {
                let res = (-1) * Number(rub.price) * Number(rub.amount) - Number(rub.comission);
                sum.push(res);
                time.push(rub.date);
            } else if (rub.operationId == 2) {
                let res = Number(rub.price) * Number(rub.amount) - Number(rub.comission);
                sum.push(res);
                time.push(rub.date); 
            }
        });
        sum.push(data.portfolioPrice);
        time.push(new Date());

        data.rate = finance.XIRR(sum, time, 0);

        data.portfolioPL = Number(data.portfolioPrice) - Number(data.income) + Number(data.outcome);

        // get secids operations 
        return libPortfolio.getSecidsOperations(portfolioId, data.secids);
    })
    .then(operations => {
        data.operations = operations;

        var secidsProfit = [];
        data.operations.forEach(secid => {

            // for each secid calculate xirr
            var obj = {};
            let amount = [];
            let time = [];
            secid.forEach(item => {

                obj.secid = item.secid;
                let sum = Number(item.price) * Number(item.amount);
                if (Number(item.operationId) == 1) {
                    sum = (-1) * sum - Number(item.comission); // Buy
                } else {
                    sum = sum - Number(item.comission); // Sell or dividends
                }
                amount.push(Number(sum));
                time.push(item.date);
            });
            // push the last data on securities price
            amount.push(Number(data.securities[obj.secid].price));
            time.push(new Date());
            //calculate XIRR

            obj.rate = finance.XIRR(amount, time, 0);
            secidsProfit.push(obj);
        });

        data.secidsProfit = secidsProfit.sort(function(a, b) {
            return b['secid'] - a['secid'];
        });

        // calculate annual profits

        // get secids for the end of each period

        let promises = [];
        data.annual.forEach(period => {
            promises.push(libPortfolio.getSecids(portfolioId, period.year + '-12-31'));
        })

        return Promise.all(promises);
    })
    .then(secids => {
        for (var i = 0; i < data.annual.length; i++) {
            data.annual[i].secids = secids[i];
        }

        // get boards for each period
        let promises = [];
        data.annual.forEach(period => {
            promises.push(getBoards(period.secids));
        });

        return Promise.all(promises);
    })
    .then(boards => {
        for (var i = 0; i < data.annual.length; i++) {
            data.annual[i].boards = boards[i];
        }

        // get prices for each period
        let promises = [];
        data.annual.forEach(period => {
            if (period.year == moment().format('YYYY')) {
                promises.push(getPrices(period.boards));
            } else {
                promises.push(getPrices(period.boards, period.year + '-12-31'));
            }
        });

        return Promise.all(promises);
    })
    .then(prices => {
        for (var i = 0; i < data.annual.length; i++) {
            data.annual[i].prices = prices[i];
        }

        // get operations for secids
        let promises = [];
        data.annual.forEach(period => {
            promises.push(libPortfolio.getSecidsOperationsYear(portfolioId, period.secids, period.year));
        });

        return Promise.all(promises);
    })
    .then(operations => {
        for (var i = 0; i < data.annual.length; i++) {
            data.annual[i].operations = operations[i];
        }


        // get amount for secids to the end of period
        let promises = [];
        data.annual.forEach(period => {
            promises.push(libPortfolio.getSecidsAmount(portfolioId, period.secids, period.year + '-12-31'));
        });

        return Promise.all(promises);
    })
    .then(amounts => {
        for (var i = 0; i < data.annual.length; i++) {
            data.annual[i].amounts = amounts[i];
        }


        // process all periods data.annual
        data.annual.forEach(period => {

            // generate new securities tables
            let obj = {};
            period.secids.forEach(secid => {
                obj[secid.secid] = {};
                obj[secid.secid].secid = secid.secid;
                obj[secid.secid].amount = 0;
                obj[secid.secid].buy = 0;
                obj[secid.secid].sell = 0;
            });
            period.securities = obj;

            // generates amounts
            period.amounts.forEach(secid => {
                period.securities[secid.secid].amount = secid.amount;
            });

            // calculate prices for each secid
            period.prices.forEach(price => {
                period.securities[price.secid].price = Number(period.securities[price.secid].amount) * Number(price.price);
            });

            // calculate buy and sell prices for securities
            period.trades.forEach(trade => {
                if (trade.secid !== data.portfolio.currency) {
                    switch(trade.operationId) {
                        case 1:
                            period.securities[trade.secid].buy = Number(period.securities[trade.secid].buy) + Number(trade.sum) + Number(trade.comission); 
                            break;
                        case 2:
                            period.securities[trade.secid].sell = Number(period.securities[trade.secid].sell) + Number(trade.sum) - Number(trade.comission);
                            break;
                    }
                }
            });

            // Calculate dividends
            period.dividends = 0;
            period.trades.forEach(trade => {
                if (trade.operationId == 3) {
                    period.dividends = Number(period.dividends) + Number(trade.sum) - Number(trade.comission);
                }
            });

            // Final balance
            period.securitiesPrice = 0;
            period.securitiesBuy = 0;
            period.securitiesSell = 0;
            for (key in period.securities) {
                period.securitiesBuy = Number(period.securitiesBuy) + Number(period.securities[key].buy);
                period.securitiesSell = Number(period.securitiesSell) + Number(period.securities[key].sell);
                period.securitiesPrice = Number(period.securitiesPrice) + Number(period.securities[key].price);
            };
            period.portfolioPrice = Number(period.cashe) + Number(period.securitiesPrice);

            // previous portfolio price
            if (moment(data.portfolio.dateopen).format('YYYY') == period.year) {
                period.prevPortfolioPrice = 0;
            } else {
                let prevIndex = data.annual.findIndex((element, index, array) => {
                    if (element.year == String(period.year-1)) {return true}
                });
                period.prevPortfolioPrice = data.annual[prevIndex].portfolioPrice;
            }

            // calculate XIRR
            var sum = [];
            var time = [];

            if (moment(data.portfolio.dateopen).format('YYYY') !== period.year) { // not starting period - add previous period
                let prevCloseDate = new Date(String(period.year-1) + '-12-31');
                time.push(prevCloseDate);

                sum.push(-period.prevPortfolioPrice);
            }

            data.rubs.forEach(rub => {
                if (rub.operationId == 1 && moment(rub.date).format('YYYY') == period.year) {
                    let res = (-1) * Number(rub.price) * Number(rub.amount) - Number(rub.comission);
                    sum.push(res);
                    time.push(rub.date);
                } else if (rub.operationId == 2 && moment(rub.date).format('YYYY') == period.year)  {
                    let res = Number(rub.price) * Number(rub.amount) - Number(rub.comission);
                    sum.push(res);
                    time.push(rub.date); 
                }
            });
            if (moment().format('YYYY') == period.year) {
                sum.push(period.portfolioPrice);
                time.push(new Date());
            } else {
                sum.push(period.portfolioPrice);
                time.push(new Date(period.year + '-12-31'));
            }

            period.rate = finance.XIRR(sum, time, 0);

            period.portfolioPL = Number(period.portfolioPrice) - Number(period.prevPortfolioPrice) - Number(period.income) + Number(period.outcome);

            // calculate XIRR for all secids fro the period
            var secidsProfit = [];
            for (key in period.securities) {

                // initial values
                let xirrData = {amount: [], time: []};
                if (period.year !== moment(data.portfolio.dateopen).format('YYYY')) { // not first period
                    let prevIndex = data.annual.findIndex((element, index, array) => {
                        if (element.year == String(period.year-1)) {return true}
                    });

                    if (typeof data.annual[prevIndex].securities[key] !== 'undefined') {
                        xirrData.amount.push(-data.annual[prevIndex].securities[key].price);
                        xirrData.time.push(new Date(data.annual[prevIndex].year + '-12-31'));
                    }
                }
                if (period.year == moment().format('YYYY')) { // current year
                    xirrData.time.push(new Date());
                    xirrData.amount.push(period.securities[key].price);
                } else {
                    xirrData.time.push(new Date(period.year + '-12-31'));
                    xirrData.amount.push(period.securities[key].price);
                }

                period.securities[key].xirrData = xirrData;

                //calculate XIRR
                // obj.rate = finance.XIRR(amount, time, 0);
                // secidsProfit.push(obj);
            };
            
            // process operations
            period.operations.forEach(secid => {
                secid.forEach(operation => {
                    let sum = 0;
                    switch (operation.operationId) {
                        case 1:
                            sum = Number(operation.price) * Number(operation.amount) + Number(operation.comission);
                            period.securities[operation.secid].xirrData.amount.push(-sum);
                            period.securities[operation.secid].xirrData.time.push(operation.date);
                            break;
                        case 2:
                            sum = Number(operation.price) * Number(operation.amount) - Number(operation.comission);
                            period.securities[operation.secid].xirrData.amount.push(sum);
                            period.securities[operation.secid].xirrData.time.push(operation.date);
                            break;
                        case 3:
                            sum = Number(operation.price) * Number(operation.amount) - Number(operation.comission);
                            period.securities[operation.secid].xirrData.amount.push(sum);
                            period.securities[operation.secid].xirrData.time.push(operation.date);
                            break;
                    }
                });
            });
            
            for (key in period.securities) {
                let arr = [];
                for (var i = 0; i<period.securities[key].xirrData.amount.length; i++) {
                    arr.push([
                        period.securities[key].xirrData.amount[i],
                        period.securities[key].xirrData.time[i]]
                    );
                }
                arr.sort((a,b) => {
                    return a[1] - b[1]
                });

                let amount = [];
                let time = [];
                arr.forEach(row => {
                    amount.push(row[0]);
                    time.push(row[1]);
                })
                let rate = finance.XIRR(amount, time, 0)
                period.securities[key].rate = rate;


            }

        }); // for each periods




//console.log(secidsProfit);
//console.log('DATA.annual', data.annual);

        // render view
        res.render('profit', {
            data: data
        });

    })
    .catch(error => console.log(error));

}