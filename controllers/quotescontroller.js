const Moex = require('../lib/moex');

var Highcharts = require('highcharts/highstock');

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

    let secid = req.params.secid;
    let user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    };

    Moex.getBoardsInfo(secid, (err, response) => {
        if (err) return next(err);
        if (response['boards']['data'].length == 0) {
            throw new Error(404, `Data not found`);
            return next(err);
        };

        var markets = response['boards']['data'][0][5];
        var boards = response['boards']['data'][0][1];

        var request = {
            'engines': response['boards']['data'][0][7],
            'markets': response['boards']['data'][0][5],
            'boards': response['boards']['data'][0][1],
            'secid': response['boards']['data'][0][0],
            'params': 'iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,SECNAME,LOTSIZE,CURRENCYID&marketdata.columns=LAST,HIGH,LOW,LASTTOPREVPRICE,NUMTRADES,ISSUECAPITALIZATION,UPDATETIME,BID,OFFER'
        }

        Moex.getSecurityInfo(request, (err, result) => {
            if (err) return next(err);

// Combine needed array for view
            let data = {
                'secid': result['securities']['data'][0][0],
                'shortname': result['securities']['data'][0][1],
                'secname': result['securities']['data'][0][2],
                'lotsize': result['securities']['data'][0][3],
                'currencyid': result['securities']['data'][0][4],
                'last': result['marketdata']['data'][0][0],
                'high': result['marketdata']['data'][0][1],
                'low': result['marketdata']['data'][0][2],
                'lasttoprevprice': result['marketdata']['data'][0][3],
                'numtrades': result['marketdata']['data'][0][4],
                'issuecapitalization': result['marketdata']['data'][0][5],
                'updatetime': result['marketdata']['data'][0][6],
                'bid': result['marketdata']['data'][0][7],
                'offer': result['marketdata']['data'][0][8]
            };

            // get History data

            Moex.getHistory(secid, boards, markets,  (err, result) => {
                
                var candles = [];
                result.forEach(items => {
                    items.forEach(item => {
                        item[0] = Date.parse(item[0]);
                        candles.push(item);
                    });
                });
                

//                console.log(candles);

                data['candles'] = candles;

                res.render('quote', {
                    title: 'Информация об инструменте', 
                    user: user,
                    data: data
                }); 
            }); // History
        }); // Security Info
    });  // Boards
}