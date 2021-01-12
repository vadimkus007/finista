const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;

const Moex = require('../lib/moex');

const sequelize = require('sequelize');
const Op = sequelize.Op;

var moment = require('moment');
var xirr = require('xirr');

var exports = module.exports = {};

exports.info = (req, res, next) => {

    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }

    const portfolioId = req.session.portfolio.id;

    const getDates = function(startDate, stopDate) {
        var dateArray = [];
        var currentDate = moment(startDate);
        var stopDate = moment(stopDate);
        while (currentDate <= stopDate) {
            dateArray.push( moment(currentDate).format('YYYY-MM-DD') )
            currentDate = moment(currentDate).add(1, 'days');
        }
        return dateArray;
    }

    // find Portfolio
    const getPortfolio = function(id) {
        return Portfolio.findOne({
            where: {
                id: id
            },
            raw: true
        })
    };

    // get secids
    const getSecids = function(portfolioId, date) {
        if (typeof date !== 'undefined') {
            return Trade.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('secid')), 'secid']],
                raw: true,
                where: {
                    [Op.and]: [
                        {'portfolioId' : portfolioId},
                        {
                            'secid': {
                                [Op.ne]: 'RUB'
                            }
                        },
                        sequelize.where(sequelize.fn('date', sequelize.col('date')), '<=', date)
                    ]
                }
            })
        } else {
            return Trade.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('secid')), 'secid']],
                raw: true,
                where: {
                    'portfolioId' : portfolioId,
                    'secid': {
                        [Op.ne]: 'RUB'
                    }
                }
            })
        }
    }

    // get Trades info
    const getTrades = function(portfolioId, date) {
        if (typeof date !== 'undefined') {
            return Trade.findAll({
                attributes: [
                    'secid',
                    'operationId',
                    [sequelize.fn('sum', sequelize.literal('(`price`*`amount`)')), 'sum'],
                    [sequelize.fn('sum', sequelize.col('comission')), 'comission'],
                    [sequelize.fn('sum', sequelize.col('amount')), 'amount']
                ],
                group: ['secid', 'operationId'],
                where: {
                    [Op.and]: [
                        {'portfolioId' : portfolioId},
                        sequelize.where(sequelize.fn('date', sequelize.col('date')), '<=', date)
                    ]
                },
                order: [
                    ['operationId', 'ASC'], 
                    ['secid', 'ASC']
                ],
                raw: true
            });
        } else {
            return Trade.findAll({
                attributes: [
                    'secid',
                    'operationId',
                    [sequelize.fn('sum', sequelize.literal('(`price`*`amount`)')), 'sum'],
                    [sequelize.fn('sum', sequelize.col('comission')), 'comission'],
                    [sequelize.fn('sum', sequelize.col('amount')), 'amount']
                ],
                group: ['secid', 'operationId'],
                where: {
                    'portfolioId' : portfolioId
                },
                order: [
                    ['operationId', 'ASC'], 
                    ['secid', 'ASC']
                ],
                raw: true
            });
        }
    }


    // share info
    const getShareInfo = function(secids) {
        // ********  MOEX data ******** 
        let urls = [];
        let url = 'https://iss.moex.com/iss/securities.json?iss.meta=off&securities.columns=secid,shortname,group,primary_boardid&q=';
        secids.forEach(secid => {
            url = `https://iss.moex.com/iss/securities.json?iss.meta=off&securities.columns=secid,shortname,group,primary_boardid&q=${secid.secid}`
            urls.push(url);
        });

        let promises = urls.map(index => Moex.fetchJSON(index));
        return Promise.all(promises)
    }

    // get boards info
    const getBoards = function(secids) {
        let urls = [];
        let url = '';
        secids.forEach(secid => {
            url = `http://iss.moex.com/iss/securities/${secid.secid}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine`;
            urls.push(url);
        });

        let promises = urls.map(index => Moex.fetchJSON(index));
        return Promise.all(promises)
    }

    const getBoardShareInfo = function(secids) {
        return Promise.all([getShareInfo(secids), getBoardInfo(secids)]);
    }

    // get market data
    const getMarketData = function(query) {

        let urls = [];
        let url = '';
        query.forEach(boards => {
            let board = boards.boards.data;
            url = `http://iss.moex.com/iss/engines/${board[0][3]}/markets/${board[0][2]}/boards/${board[0][1]}/securities/${board[0][0]}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=SECID,LAST,LASTTOPREVPRICE,CHANGE`;
            urls.push(url);
        });
        let promises = urls.map(index => Moex.fetchJSON(index));
        return Promise.all(promises)
    }

    const getRubs = function(id) {
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
                        secid: 'RUB'
                    },
                    raw: true
        });
    }

    const renderView = function(data) {
        var renderdata = {};

        renderdata.portfolio = data.portfolio;
        renderdata.shares = data.shares;
        renderdata.etf = data.etf;
        renderdata.history = data.history;

        // render
        res.render('portfolio/index', {
            data: renderdata
        });
    }

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
    }

    // get array of histories for all secids
    // secids = [{secid: value, boardid: value, market: value, engine: value}]
    const getHistories = function(secids, startDate, endDate) {
        return new Promise((resolve, reject) => {
            let promises = secids.map(secid => getHistory(secid, startDate, endDate));
            Promise.all(promises)
            .then(history => {
                resolve(history);
            })
            .catch(err => reject(err));
        })
    }

/* get price of portfolio on date

    */
    const getPortfolioPriceOnDate = function(id, dateStart, dateEnd) {
       
        var data = {};
        return new Promise((resolve, reject) => {
            getPortfolio(id)
            .then(portfolio => {
                data.portfolio = portfolio;
                return getSecids(id, date)
            })
            .then(secids => {
                data.secids = secids;
/*
                return getTrades(id, dateEnd);
            })
            .then(trades => {
                data.trades = trades;
*/
                // get boards info
                return getBoards(data.secids)
            })
            .then(boards => {
                data.boards = boards;

                // restructure data.secids
                let newArr = [];
                data.secids.forEach(item => {
                    newArr[item.secid] = {secid: item.secid, amount: 0, price: 0};
                });
                data.secids = newArr;

                // adding boards info to data.secids
                data.boards.forEach(item => {
                    data.secids[item.boards.data[0][0]].boardid = item.boards.data[0][1];
                    data.secids[item.boards.data[0][0]].market = item.boards.data[0][2];
                    data.secids[item.boards.data[0][0]].engine = item.boards.data[0][3];
                });


                let request = [];
                for (key in data.secids) {
                    let secid = data.secids[key];
                    request.push(secid);
                }

                return getHistories(request, dateStart, dateEnd)
            })
            .then(history => {
                data.history = history;

                // process history

                let newHistory = [];
                // empty array of dates
                data.history.forEach(secid => {
                    secid.forEach(row => {
                        newHistory[row[1]] = {};
                    });
                });
                // add elements to new history
                data.history.forEach(secid => {
                    secid.forEach(row => {
                        newHistory[row[1]][row[0]] = row[2];
                    });
                });
                data.history = newHistory;

                // get secids on all dates in history
                let promises = [];
                for (var date in data.history) {
                    promises.push(getSecids(id, date));
                }
                return Promise.all(promises);
            })
            .then(secids => {
                data.secids = secids;

                // get trades for all dates in history
                let promises = [];
                for (var date in data.history) {
                    promises.push(getTrades(id, date));
                }
                return Promise.all(promises);
            })
            .then(trades => {
                data.trades = trades;

                // restructure data.secids
                for (var index = 0; index < data.secids.length; index++) {
                    let newArr = [];
                    data.secids[index].forEach(item => {    
                        newArr[item.secid] = {secid: item.secid, amount: 0, price: 0};
                    });
                    data.secids[index] = newArr;
                }
                
                // create array of dates
                var dateIndex = [];
                for (var date in data.history) {
                    dateIndex.push(date);
                }

                // calculate price for each data.history date
                for (var index = 0; index<dateIndex.length; index++) {
                    for (var key in data.secids[index]) {
                        data.secids[index][key].price = data.history[dateIndex[index]][key];
                    }
                }

                // portfolio cost on date calculation
                data.cashe = [];
                data.sharesCost = [];
                data.cost = [];
                for (var index = 0; index<dateIndex.length; index++) {

                    data.cashe[index] = 0;
                    data.trades[index].forEach(item => {
                        switch(item.operationId) {
                            case 1:
                                if (item.secid === 'RUB') {
                                    data.cashe[index] = data.cashe[index] + Number(item.sum) - Number(item.comission);
                                } else {
                                    data.secids[index][item.secid].amount = data.secids[index][item.secid].amount + Number(item.amount);
                                    data.cashe[index] = data.cashe[index] - Number(item.sum) - Number(item.comission);
                                }
                                break;
                            case 2:
                                if (item.secid === 'RUB') {
                                    data.cashe[index] = data.cashe[index] - Number(item.sum) - Number(item.comission);
                                } else {
                                    data.secids[index][item.secid].amount = data.secids[index][item.secid].amount - Number(item.amount);
                                    data.cashe[index] = data.cashe[index] + Number(item.sum) - Number(item.comission);
                                }
                                break;
                            case 3:
                                if (item.secid !== 'RUB') {
                                    data.cashe[index] = data.cashe[index] + Number(item.sum) - Number(item.comission);
                                }
                        }
                    });
                    data.sharesCost[index] = 0;
                    for (key in data.secids[index]) {
                        data.sharesCost[index] = data.sharesCost[index] + data.secids[index][key].price * data.secids[index][key].amount;
                    };

                    data.cost[index] = Number(data.sharesCost[index] + data.cashe[index]).toFixed(2);

                }

                // combine all calculated data to return array = [date, cost]
                var result = [];
                for (var index = 0; index<dateIndex.length; index++) {
                    let ar = [Date.parse(dateIndex[index]), Number(data.cost[index])];
                    result.push(ar);
                }

                resolve(result);

            })
            .catch(err => {reject(err)});
        });

    }

    const getPortfolioPrice = function(id, date) {
        
        return new Promise((resolve, reject) => {

            var data = {};
            var securities = [];
            var total_cashe_in = 0.00;
            var total_cashe_out = 0;

            getPortfolio(parseInt(id))
            .then(portfolio => {
                data.portfolio = portfolio;
                return getTrades(data.portfolio.id)
            })
            .then(trades => {
                data.trades = trades;
                return getSecids(data.portfolio.id)
            })
            .then(secids => {
                data.secids = secids;
                return getShareInfo(secids);
            })
            .then(shareInfo => {
                data.shares = shareInfo;
                return getBoards(data.secids);
            })
            .then(boardInfo => {
                data.boards = boardInfo;
                return getMarketData(boardInfo);
            })
            .then(marketdata => {
                data.marketdata = marketdata;
                return getRubs(data.portfolio.id);
            })
            .then(rubs => {

                data.rubs = rubs;

                // calculate data and prepare for render

                let cashe = 0;

                data.trades.forEach(trade => {
                    securities[trade.secid] = {};
                    securities[trade.secid]['buy'] = 0;
                    securities[trade.secid]['sell'] = 0;
                    securities[trade.secid]['amount'] = 0;
                    securities[trade.secid]['dividends'] = 0;
                });

                // calculate securities data
                data.trades.forEach(trade => {
                    switch (trade.operationId) {
                        case 1:
                            securities[trade.secid].buy = Number(securities[trade.secid].buy) + Number(trade.sum) + Number(trade.comission);
                            securities[trade.secid].amount = Number(securities[trade.secid].amount) + Number(trade.amount);
                            securities[trade.secid]['meanprice'] = Number(securities[trade.secid].buy) / Number(securities[trade.secid].amount);
                            break;
                        case 2: 
                            securities[trade.secid].sell = Number(securities[trade.secid].sell) + Number(trade.sum) - Number(trade.comission);
                            securities[trade.secid].amount = Number(securities[trade.secid].amount) - Number(trade.amount);
                            break;
                        case 3: 
                            securities[trade.secid].dividends = Number(securities[trade.secid].dividends) + Number(trade.sum) - Number(trade.comission);
                            break;
                    }
                });

                //calculate cashe
                for (key in securities) {
                    if (key == 'RUB') {
                        cashe = cashe + securities[key].buy - securities[key].sell;
                    } else {
                        cashe = cashe - securities[key].buy + securities[key].sell + securities[key].dividends;
                    }
                }


                data.portfolio.cashe = cashe;
                data.portfolio.casheIn = securities.RUB.buy;
                // remove RUB from securities
                delete securities['RUB'];


                    // shareInfo
                    data.shares.forEach(info => {
                        info.securities.data.forEach(dim => {
                                
                            if (Object.keys(securities).includes(dim[0])) {
                                    
                                securities[dim[0]]['secid'] = dim[0];
                                securities[dim[0]]['shortname'] = dim[1];
                                securities[dim[0]]['group'] = dim[2];
                                securities[dim[0]]['boardid'] = dim[3];

                            }
                        })
                    });

                    // boards info
                    data.boards.forEach(board => {
                        securities[board.boards.data[0][0]]['boardid'] = board.boards.data[0][1];
                        securities[board.boards.data[0][0]]['market'] = board.boards.data[0][2];
                        securities[board.boards.data[0][0]]['engine'] = board.boards.data[0][3];
                    });


                    // CALCULATE MARKET DATA
                    data.marketdata.forEach(row => {
                        securities[row.marketdata.data[0][0]]['last'] = row.marketdata.data[0][1];
                        securities[row.marketdata.data[0][0]]['lasttoprevprice'] = row.marketdata.data[0][2];
                        securities[row.marketdata.data[0][0]]['change'] = row.marketdata.data[0][3];
                    });

                    for (key in securities) {
                        securities[key]['cost'] = securities[key].last * securities[key].amount;
                        securities[key]['exchangeprofit'] = (securities[key].last - securities[key].meanprice) * securities[key].amount;
                        securities[key]['exchangeprofitprcnt'] = 100*securities[key]['exchangeprofit']/securities[key]['buy'];
                        securities[key]['profit'] = Number(securities[key].sell) + Number(securities[key].cost) + Number(securities[key].dividends) - Number(securities[key].buy);
                        securities[key]['totalchange'] = securities[key].change * securities[key].amount;
                    }

                // prepare data for view
                                let shares = [];
                                let etf = [];

                                data.portfolio = data.portfolio;

                                data.portfolio.cashe = data.portfolio.cashe.toFixed(2);

                                data.shares = {};
                                data.etf = {};

                                data.portfolio.shares = {};
                                data.portfolio.etf = {};

                                for (key in securities) {
                                    switch(securities[key]['group']) {
                                        case 'stock_shares':
                                            shares.push(securities[key]);
                                            break;
                                        case 'stock_dr':
                                            shares.push(securities[key]);
                                            break;
                                        case 'stock_etf':
                                            etf.push(securities[key]);
                                            break;
                                        case 'stock_ppif':
                                            etf.push(securities[key]);
                                            break;
                                    }
                                }

                                // data for parts of shares - etf
                                let cost_shares = 0;
                                let cost_etf = 0;

                                data.portfolio.shares.profit = 0;
                                data.portfolio.etf.profit = 0;
                                data.portfolio.shares.change = 0;
                                data.portfolio.etf.change = 0;

                                shares.forEach(item => {
                                    cost_shares = Number(cost_shares) + Number(item.cost);
                                    data.portfolio.shares.profit = data.portfolio.shares.profit + Number(item.profit);
                                    data.portfolio.shares.change = data.portfolio.shares.change + Number(item.totalchange);
                                });
                                data.portfolio.shares.cost = cost_shares;
                                for (key in shares) {
                                    shares[key]['percentage'] = 100* shares[key].cost / cost_shares;
                                }


                                etf.forEach(item => {
                                    cost_etf = Number(cost_etf) + Number(item.cost);
                                    data.portfolio.etf.profit = Number(data.portfolio.etf.profit) + Number(item.profit);
                                    data.portfolio.etf.change = Number(data.portfolio.etf.change) + Number(item.totalchange);
                                });
                                data.portfolio.etf.cost = cost_etf;
                                for (key in etf) {
                                    etf[key]['percentage'] = 100* etf[key].cost / cost_etf;
                                }

                                data.shares = shares;
                                data.etf = etf;


                                // portfolio data
                                data.portfolio.cost = Number(data.portfolio.shares.cost) + 
                                                    Number(data.portfolio.etf.cost) + 
                                                    Number(data.portfolio.cashe);
                                data.portfolio.profit = Number(data.portfolio.shares.profit) + Number(data.portfolio.etf.profit);
                                data.portfolio.change = Number(data.portfolio.shares.change) + Number(data.portfolio.etf.change);

                                // date processing
                                let dateopen = new Date(data.portfolio.dateopen);
                                let today = Date.now();
                                let days = today - dateopen;
                                days = Math.ceil(days/(1000*60*60*24));

                                data.portfolio.annualyield = 100 * (365/days) * data.portfolio.profit / data.portfolio.casheIn;

        // calculation of xirr
                              
                var args = [];
                data.rubs.forEach(rub => {
                    if (rub.operationId == 1) {
                        let row = {
                            amount: Number(rub.comission) - (Number(rub.price) * Number(rub.amount)),
                            when: rub.date
                        }
                        args.push(row);
                    } else if (rub.operationId == 2) {
                        let row = {
                            amount: (Number(rub.price) * Number(rub.amount)) - Number(rub.comission),
                            when: rub.date
                        }
                        args.push(row);
                    }
                });
                let row = {
                    amount: Number(data.portfolio.cost), 
                    when: new Date()
                };
                args.push(row);

                var rate = xirr(args);

                data.portfolio['xirr'] = rate * 100;
                data.portfolio.xirr = data.portfolio.xirr.toFixed(2);

                if (date == now) {
                    resolve({date: date, data: data});
                }

            })
            .catch(err => reject(err));


        });
    }

    //***********************************************************************************************

    var data = {};
    //var securities = [];
    //var total_cashe_in = 0.00;
    //var total_cashe_out = 0;
    var now = new Date().toISOString().slice(0,10);
    var date = now;
    // date = new Date('2021-01-06').toISOString().slice(0,10);
    var dateStart = '2020-07-13';
    var dateEnd = now;

    getPortfolioPrice(portfolioId, date)
    .then(portfolio => {

        data = portfolio.data;

        dateStart = data.portfolio.dateopen.toISOString().slice(0,10);

/*
        let promises = [];
        range.forEach(date => {
            promises.push(getPortfolioPriceOnDate(req.params.id, date));
        });
*/
        return getPortfolioPriceOnDate(portfolioId, dateStart, dateEnd)
        // return Promise.all(promises);
    })
    .then(history => {

//        console.log('*** DATA ***', data);
//        console.log('*** RES.secids ***', res.data.secids);
//        console.log('*** RES.trades ***', res.data.trades);
//        console.log('*** HISTORY ***', history);
        data.history = history;


        renderView(data);
    })
    .catch(err => console.log(err));

}

