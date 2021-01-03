const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;

const Moex = require('../lib/moex');

var exports = module.exports = {};

exports.info = (req, res, next) => {

    var data = {};
    var total_cashe_in = 0.00;

    // get portfolio info
    Portfolio.findOne({
        where: {id: req.params.id},
        raw: true
    })
    .then(portfolio => {
        if (portfolio === null) {
          console.log('Not found!');
        } 

        data.portfolio = portfolio;

        // add empty json for shares and etf
        data.portfolio.shares = {};
        data.portfolio.etf = {};

        // get Database info

        var dbResults = [];
        var promises = [];

        // Buy prices
        var fn = Trade.findAll({
            attributes: [
                'secid',
                [Trade.sequelize.fn('sum', Trade.sequelize.literal('(`price`*`amount` + `comission`)')), 'buy'],
                [Trade.sequelize.fn('sum', Trade.sequelize.col('amount')), 'amount'],
                [Trade.sequelize.fn('min', Trade.sequelize.col('date')), 'date']
            ],
            group: ['secid'],
            where: {'operationId' : 1},
            raw: true
        });

        promises.push(fn);

        // Sell prices
        fn = Trade.findAll({
            attributes: [
                'secid',
                [Trade.sequelize.fn('sum', Trade.sequelize.literal('(`price`*`amount` - `comission`)')), 'sell'],
                [Trade.sequelize.fn('sum', Trade.sequelize.col('amount')), 'amount']
            ],
            group: ['secid'],
            where: {'operationId' : 2},
            raw: true
        });

        promises.push(fn);

        // Dividends 
        var fn = Trade.findAll({
            attributes: [
                'secid',
                [Trade.sequelize.fn('sum', Trade.sequelize.literal('(`price`*`amount` + `comission`)')), 'dividend'],
            ],
            group: ['secid'],
            where: {'operationId' : 3},
            raw: true
        });

        promises.push(fn);

        Promise.all(promises)
        .then(results => {

            // process results
            
// console.log('results', results);

            var total_shares = []; 
            var cashe = 0.0;
            // BUY
            results[0].forEach(result => {
                if (result.secid !== 'RUB') {
                    total_shares[result.secid] = {};
                    total_shares[result.secid]['buy'] = result.buy;
                    total_shares[result.secid]['sell'] = 0;
                    total_shares[result.secid]['amount'] = result.amount;
                    total_shares[result.secid]['meanprice'] = result.buy / result.amount;
                    total_shares[result.secid]['dividends'] = 0;
                    total_shares[result.secid]['firstdate'] = result.date;
                    cashe = cashe - Number(result.buy);
                } else {
                    cashe = cashe + Number(result.buy);
                    total_cashe_in = Number(result.buy);
                }
            });

            // SELL
            results[1].forEach(result => {
                if (result.secid !== 'RUB') {
                    total_shares[result.secid]['sell'] = total_shares[result.secid]['sell'] + result.sell;
                    total_shares[result.secid]['amount'] = total_shares[result.secid]['amount'] - result.amount;
                    cashe = cashe + Number(result.sell);
                } else {
                    cashe = cashe - Number(result.sell); // cashe out
                    total_cashe_out = Number(result.sell);
                }
            });

            // DIVIDENDS
            results[2].forEach(result => {
                cashe = cashe + Number(result.dividend);
                total_shares[result.secid]['dividends'] = result.dividend;
            });

            data.portfolio.cashe = cashe.toFixed(2);

            // ********  MOEX data ******** 
            let urls = [];
            let url = 'https://iss.moex.com/iss/securities.json?iss.meta=off&securities.columns=secid,shortname,group,primary_boardid&q=';
            for (key in total_shares) {
                url = `https://iss.moex.com/iss/securities.json?iss.meta=off&securities.columns=secid,shortname,group,primary_boardid&q=${key}`
                urls.push(url);
            }

            let promises = urls.map(index => Moex.fetchJSON(index));
            Promise.all(promises)
            .then(share_info => {

                share_info.forEach(info => {
                    info.securities.data.forEach(dim => {
                        
                        if (Object.keys(total_shares).includes(dim[0])) {
                            
                            total_shares[dim[0]]['secid'] = dim[0];
                            total_shares[dim[0]]['shortname'] = dim[1];
                            total_shares[dim[0]]['group'] = dim[2];
                            total_shares[dim[0]]['boardid'] = dim[3];

                        }
                    })
                });


                // get market data

                let urls = [];
                let url = '';
                for (key in total_shares) {
                    url = `http://iss.moex.com/iss/securities/${key}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine`;
                    urls.push(url);
                }

                let promises = urls.map(index => Moex.fetchJSON(index));
                Promise.all(promises)
                .then(rows => {

                    rows.forEach(row => {                       
                        total_shares[row.boards.data[0][0]]['secid'] = row.boards.data[0][0];
                        total_shares[row.boards.data[0][0]]['boardid'] = row.boards.data[0][1];
                        total_shares[row.boards.data[0][0]]['market'] = row.boards.data[0][2];
                        total_shares[row.boards.data[0][0]]['engine'] = row.boards.data[0][3];
                    });

                    // get market data
                    let urls = [];
                    let url = '';
                    for (key in total_shares) {
                        url = `http://iss.moex.com/iss/engines/${total_shares[key].engine}/markets/${total_shares[key].market}/boards/${total_shares[key].boardid}/securities/${total_shares[key].secid}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=SECID,LAST,LASTTOPREVPRICE,CHANGE`;
                        urls.push(url);
                    }
                    let promises = urls.map(index => Moex.fetchJSON(index));
                    Promise.all(promises)
                    .then(rows => {

                        rows.forEach(row => {
                            total_shares[row.marketdata.data[0][0]]['last'] = row.marketdata.data[0][1];
                            total_shares[row.marketdata.data[0][0]]['lasttoprevprice'] = row.marketdata.data[0][2];
                            total_shares[row.marketdata.data[0][0]]['change'] = row.marketdata.data[0][3];
                        });

                        // CALCULATE MARKET DATA

                        for (key in total_shares) {
                            total_shares[key]['cost'] = total_shares[key].last * total_shares[key].amount;
                            total_shares[key]['exchangeprofit'] = (total_shares[key].last - total_shares[key].meanprice) * total_shares[key].amount;
                            total_shares[key]['exchangeprofitprcnt'] = 100*total_shares[key]['exchangeprofit']/total_shares[key]['buy'];
                            total_shares[key]['profit'] = Number(total_shares[key].sell) + Number(total_shares[key].cost) + Number(total_shares[key].dividends) - Number(total_shares[key].buy);
                            total_shares[key]['totalchange'] = total_shares[key].change * total_shares[key].amount;
                        }

                      
//console.log(total_shares);

                        // prepare data for view
                        let shares = [];
                        let etf = [];

                        for (key in total_shares) {
                            switch(total_shares[key]['group']) {
                                case 'stock_shares':
                                    shares.push(total_shares[key]);
                                    break;
                                case 'stock_dr':
                                    shares.push(total_shares[key]);
                                    break;
                                case 'stock_etf':
                                    etf.push(total_shares[key]);
                                    break;
                                case 'stock_ppif':
                                    etf.push(total_shares[key]);
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


// console.log('shares: ', shares);
// console.log('etf: ', etf);

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

                        data.portfolio.annualyield = 100 * (365/days) * data.portfolio.profit / total_cashe_in;

// ***** HISTORY data on portfolio price
/*
// console.log('total_shares', total_shares);
//console.log('data', data);

                        let promises = [];
                        let sharesKeys = [];
                        for (key in total_shares) {
                            promises.push(Moex.getHistoryFromDate(
                                total_shares[key].secid,
                                total_shares[key].boardid,
                                total_shares[key].market,
                                total_shares[key].engine,
                                data.portfolio.dateopen.toISOString().slice(0,10)
                            ));
                            sharesKeys.push(total_shares[key].secid);
                        }

                        Promise.all(promises)
                        .then(results => {
                            // process results
                            
                            for (var i=0;i<results.length;i++) {
                                results[i].forEach(row => {
                                    let obj = {};
                                    obj[row[0]] = row[1];
                                    row.push(obj);
                                    row.splice(0,2);
                                });
                            };

                            let max = 0;
                            for (var i=0;i<results.length;i++) {
                                if (results.length > max) {max = results.length};
                            }
                            // set max column to first

                            // get trades for portfolio

                            Trade.findAll({
                                where: {
                                    portfolioId: parseInt(data.portfolio.id)
                                },
                                raw: true,
                                order: [
                                    ['date', 'ASC']
                                ]
                            })
                            .then(trades => {
                                // console.log(trades);

                                // process portfolio cost

                                // initial settings
                                var history = [];
                                console.log('results[0]', results[0]);
                                console.log('trades', trades);

                                for (var i = 0; i<results[0].length; i++) {

                                }


                                // render view
                                res.render('portfolio/index', {
                                    data: data
                                });

                            })
                            .catch(err => console.log(err));

                            

                        })
                        .catch(err => console.log(err));


                        
*/
// ***** HISTORY data on portfolio price

                        // render view
                        res.render('portfolio/index', {
                            data: data
                        });

                    }).catch(err => console.log(err)); // market data


                })
                .catch(err => console.log(err)); // boards info


                


            }).catch(err => console.log(err)); // promises moex

        })
        .catch(err => {
            console.log('Error reading database', err);
        }); // find total buy

        
    })
    .catch(err => {
        console.log('Error reading portfolio: ', err)
    });

}

