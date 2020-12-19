const Moex = require('../lib/moex');

// var Highcharts = require('highcharts/highstock');

var exports = module.exports = {}

exports.list = (req, res, next) => {
    
    var result = {};

    // request stocks data
    let request = {
            'engine': 'stock', 
            'market': 'shares', 
            'board': 'TQBR',
            'params': 'iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME&marketdata.columns=LAST,OPEN,LOW,HIGH,WAPRICE,VALTODAY,TIME,LASTTOPREVPRICE'
        };

    Moex.getSequrities(request, (err, dataStocks) => {
        if (dataStocks['securities']['data'].length == 0) {
            throw new Error(404, `Data not found`);
            return next(err);
        };

        let data = [];
        let sdata = dataStocks['securities']['data'];
        let mdata = dataStocks['marketdata']['data'];

        for (var i = 0; i < dataStocks['securities']['data'].length; i++) {
            data.push({
                'secid': sdata[i][0],
                'shortname': sdata[i][1],
                'last': mdata[i][0],
                'open': mdata[i][1],
                'low': mdata[i][2],
                'high': mdata[i][3],
                'waprice': mdata[i][4],
                'valtoday': mdata[i][5],
                'time': mdata[i][6],
                'lasttoprevprice': mdata[i][7]
            });
        };

        result.stock = data;

        // request etf data

        let request1 = {
            'engine': 'stock', 
            'market': 'shares', 
            'board': 'TQTF',
            'params': 'iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME&marketdata.columns=LAST,OPEN,LOW,HIGH,WAPRICE,VALTODAY,TIME,LASTTOPREVPRICE'
        };
        Moex.getSequrities(request1, (err, dataETF) =>{ 
            data = [];
            for (var i = 0; i < dataETF['securities']['data'].length; i++) {
                data.push({
                    'secid': dataETF['securities']['data'][i][0],
                    'shortname': dataETF['securities']['data'][i][1],
                    'last': dataETF['marketdata']['data'][i][0],
                    'open': dataETF['marketdata']['data'][i][1],
                    'low': dataETF['marketdata']['data'][i][2],
                    'high': dataETF['marketdata']['data'][i][3],
                    'waprice': dataETF['marketdata']['data'][i][4],
                    'valtoday': dataETF['marketdata']['data'][i][5],
                    'time': dataETF['marketdata']['data'][i][6],
                    'lasttoprevprice': dataETF['marketdata']['data'][i][7]
                });
            }
            
            result.etf = data;

            // request index data

            let request2 = 'http://iss.moex.com/iss/engines/stock/markets/index/securities.json?iss.meta=off';
            Moex.getCustom(request2, (err, dataIndex) => { 

                data = [];
                for (var i = 0; i < dataIndex['securities']['data'].length; i++) {
                    data.push({
                        'secid': dataIndex['securities']['data'][i][0],
                        'shortname': dataIndex['securities']['data'][i][4],
                        'annualhigh': dataIndex['securities']['data'][i][5],
                        'annuallow': dataIndex['securities']['data'][i][6],
                        'currency': dataIndex['securities']['data'][i][7],
                        'boardid': dataIndex['securities']['data'][i][1],
                        'lastvalue': dataIndex['marketdata']['data'][i][2],
                        'openvalue': dataIndex['marketdata']['data'][i][3],
                        'currentvalue': dataIndex['marketdata']['data'][i][4],
                        'lastchange': dataIndex['marketdata']['data'][i][5],
                        'lastchangetoopenprc': dataIndex['marketdata']['data'][i][6],
                        'lastchangetoopen': dataIndex['marketdata']['data'][i][7],
                        'updatetime': dataIndex['marketdata']['data'][i][8],
                        'lastchangeprc': dataIndex['marketdata']['data'][i][9],
                        'valtoday': dataIndex['marketdata']['data'][i][10],
                        'monthchangeprc': dataIndex['marketdata']['data'][i][11],
                        'yearchangeprc': dataIndex['marketdata']['data'][i][12]
                    });
                }

                result.index = data;

                // get User from request
                let user = 0;
                if (req.isAuthenticated()) {
                    user = req.session.passport.user;
                }
                    
                // Render view
                res.render('quotes', {
                    title: 'Котировки',
                    user: user,
                    data: result
                });

            }); // index
        }); // etf
    }); // stock
}

exports.info = (req, res, next) => {

    var data = {};
    data.secid = req.params.secid;


    var secid = req.params.secid;
    var markets = '';
    var engines = '';
    var boards = '';

    var user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    };

    // Get boards info e.g. engines, markets, boards 
    let urls = [];
    let url = `http://iss.moex.com/iss/securities/${data.secid}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine`;
    urls.push(url);

    let promises = urls.map(index => Moex.fetchJSON(index));
    Promise.all(promises)
    .then(result => {
        for (key in result[0].boards.columns) {
            data[result[0].boards.columns[key]] = result[0].boards.data[0][key];
        }

        // get security info
        let urls = [];
        let url = `http://iss.moex.com/iss/engines/${data.engine}/markets/${data.market}/boards/${data.boardid}/securities/${data.secid}.json?iss.meta=off&iss.only=securities,marketdata`;
        urls.push(url);

        let promises = urls.map(index => Moex.fetchJSON(index));
        Promise.all(promises)
        .then(row => {

            // parse obtained data
            for (key in row[0].securities.columns) {
                data[row[0].securities.columns[key]] = row[0].securities.data[0][key];
            }
            for (key in row[0].marketdata.columns) {
                data[row[0].marketdata.columns[key]] = row[0].marketdata.data[0][key];
            }

            // get History data
            Moex.getHistory(data.secid, data.boardid, data.market, data.engine,  (err, result) => {
                
                var candles = [];
                result.forEach(items => {
                    items.forEach(item => {
                        item[0] = Date.parse(item[0]);
                        candles.push(item);
                    });
                });
                
                data['candles'] = candles;

                // Dividends
                Moex.getCustom('https://iss.moex.com/iss/securities/'+data['secid']+'/dividends.json?iss.meta=off&dividends.columns=registryclosedate,value', (err, result) => {
                    
                    data['dividends'] = result['dividends']['data'];

                    // get prices to given dates
                    let urls = [];
                    let baseURL = `http://iss.moex.com/iss/history/engines/${data.engine}/markets/${data.market}/boards/${data.boardid}/securities/${data.secid}.json?iss.meta=off&history.columns=TRADEDATE,CLOSE`;
                    
                    data['dividends'].forEach(item => {
                        urls.push(baseURL + '&from=' + item[0] + '&till=' + item[0]);
                    });

                    let promises = urls.map(url => Moex.fetchJSON(url));

                    Promise.all(promises).then(responses => {
                        for (var i = 0; i < responses.length; i++) {
                            data['dividends'][i].push(responses[i]['history']['data'][0][1]);
                            let div = data['dividends'][i][1];
                            let price = data['dividends'][i][2];
                            let dy = 100 * div / price;

                            data['dividends'][i].push(dy.toFixed(1));
                        };


console.log(data);

                        res.render('quote', {
                            title: 'Информация об инструменте', 
                            user: user,
                            data: data
                        });  // render

                    }).catch(err => console.log('Error getting request from MOEX: ', err));

                }); // Dividends
            }); // History
        }).catch(err => console.log('Error getting request from MOEX: ', err)); // Security info
    }).catch(error => console.log('Error getting request from MOEX: ', error)); // Board info
}