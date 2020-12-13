const Moex = require('../lib/moex');

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

        var request = {
            'engines': response['boards']['data'][0][7],
            'markets': response['boards']['data'][0][5],
            'boards': response['boards']['data'][0][1],
            'secid': response['boards']['data'][0][0]
        }

        Moex.getSecurityInfo(request, (err, result) => {
            if (err) return next(err);

// Combine needed array for view
            let data = {
                'secid': result['securities']['data'][0][0],
                'secname': result['securities']['data'][0][9],
                'lotsize': result['securities']['data'][0][4],
                'currencyid': result['securities']['data'][0][24],
                'last': result['marketdata']['data'][0][12],
                'lastchange': result['marketdata']['data'][0][13],
                'lastchangeprcnt': result['marketdata']['data'][0][14],
                'updatetime': result['marketdata']['data'][0][32]
            };

            res.render('quote', {
                title: 'Информация об инструменте', 
                user: user,
                data: data
            });

        });
    });
}