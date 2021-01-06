const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;

const Moex = require('../lib/moex');

const sequelize = require('sequelize');
const Op = sequelize.Op;

var exports = module.exports = {};

exports.info = (req, res, next) => {

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
        return Trade.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('secid')), 'secid']],
            raw: true,
            where: {
                'portfolioId' : portfolioId,
                'secid': {
                    [Op.ne]: 'RUB'
                },
                'date': {
                    [Op.lte] : date
                }
            }
        })
    }

    // get Trades info
    const getTrades = function(portfolioId, date) {

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
                'portfolioId' : portfolioId,
                'date' : {
                    [Op.lte]: date
                }
            },
            order: [
                ['operationId', 'ASC'], 
                ['secid', 'ASC']
            ],
            raw: true
        });
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

    

    //***********************************************************************************************

    var data = {};
    var total_cashe_in = 0.00;
    var total_cashe_out = 0;
    var now = new Date().toISOString().slice(0,10);
    var date = now;

    getPortfolio(parseInt(req.params.id))
    .then(portfolio => {
        data.portfolio = portfolio;
        return getTrades(data.portfolio.id, date)
    })
    .then(trades => {
        data.trades = trades;
        return getSecids(data.portfolio.id, date)
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

        // calculate data and prepare for render
        var renderdata = {};
        
        renderdata.portfolio = data.portfolio;

        let results = data.trades;

        let cashe = 0;

        var securities = [];

        data.trades.forEach(trade => {
            securities[trade.secid] = {};
            securities[trade.secid]['buy'] = 0;
            securities[trade.secid]['sell'] = 0;
            securities[trade.secid]['amount'] = 0;
            securities[trade.secid]['dividends'] = 0;
        });

console.log('TRADES: ',data.trades);

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
            console.log(key);
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
//console.log(data.marketdata);
//console.log('rednerdata', renderdata);


        // prepare data for view
                        let shares = [];
                        let etf = [];

                        renderdata.portfolio.cashe = data.portfolio.cashe.toFixed(2);

                        renderdata.shares = {};
                        renderdata.etf = {};

                        renderdata.portfolio.shares = {};
                        renderdata.portfolio.etf = {};

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

                        renderdata.portfolio.shares.profit = 0;
                        renderdata.portfolio.etf.profit = 0;
                        renderdata.portfolio.shares.change = 0;
                        renderdata.portfolio.etf.change = 0;

                        shares.forEach(item => {
                            cost_shares = Number(cost_shares) + Number(item.cost);
                            renderdata.portfolio.shares.profit = renderdata.portfolio.shares.profit + Number(item.profit);
                            renderdata.portfolio.shares.change = renderdata.portfolio.shares.change + Number(item.totalchange);
                        });
                        renderdata.portfolio.shares.cost = cost_shares;
                        for (key in shares) {
                            shares[key]['percentage'] = 100* shares[key].cost / cost_shares;
                        }


                        etf.forEach(item => {
                            cost_etf = Number(cost_etf) + Number(item.cost);
                            renderdata.portfolio.etf.profit = Number(renderdata.portfolio.etf.profit) + Number(item.profit);
                            renderdata.portfolio.etf.change = Number(renderdata.portfolio.etf.change) + Number(item.totalchange);
                        });
                        renderdata.portfolio.etf.cost = cost_etf;
                        for (key in etf) {
                            etf[key]['percentage'] = 100* etf[key].cost / cost_etf;
                        }


// console.log('shares: ', shares);
// console.log('etf: ', etf);

                        renderdata.shares = shares;
                        renderdata.etf = etf;


                        // portfolio data
                        renderdata.portfolio.cost = Number(renderdata.portfolio.shares.cost) + 
                                            Number(renderdata.portfolio.etf.cost) + 
                                            Number(renderdata.portfolio.cashe);
                        data.portfolio.profit = Number(data.portfolio.shares.profit) + Number(data.portfolio.etf.profit);
                        data.portfolio.change = Number(data.portfolio.shares.change) + Number(data.portfolio.etf.change);

                        // date processing
                        let dateopen = new Date(data.portfolio.dateopen);
                        let today = Date.now();
                        let days = today - dateopen;
                        days = Math.ceil(days/(1000*60*60*24));

                        renderdata.portfolio.annualyield = 100 * (365/days) * renderdata.portfolio.profit / data.portfolio.casheIn;

                        // render
                        res.render('portfolio/index', {
                            data: renderdata
                        });

    })
    .catch(err => console.log(err));

}

