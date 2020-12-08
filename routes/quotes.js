const Moex = require('../lib/moex');

exports.list = (req, res, next) => {

    var result = {};

    let request = {'engine': 'stock', 'market': 'shares', 'board': 'TQBR'};
    
    Moex.getSequrities(request, (err, response) => {
        if (err) return next(err);

        if (response['securities']['data'].length == 0) {
            throw new Error(404, `Data not found`);
            return next(err);
        };

        let sdata = response['securities']['data']; 
        let mdata = response['marketdata']['data'];

        let data = [];

        for (var i = 0; i < sdata.length; i++) {
            data.push({
                'secid': sdata[i][0],
                'shortname': sdata[i][2],
                'lotsize': sdata[i][4],
                'prevadmittedquote': sdata[i][23],
                'currency': (sdata[i][24] == 'SUR') ? 'RUB' : null,
                'last': mdata[i][12],
                'change': mdata[i][25]
            });
        }

        result.stock = data; 

        // Another request to server for ETF data
        let request1 = {'engine': 'stock', "market": 'shares', 'board': 'TQTF'};
        Moex.getSequrities(request1, (err, dataETF) => {
            if (err) return next(err);
            let data = [];
            for (var i = 0; i < dataETF['securities']['data'].length; i++) {
                data.push({
                    'secid': dataETF['securities']['data'][i][0],
                    'shortname': dataETF['securities']['data'][i][2],
                    'lotsize': dataETF['securities']['data'][i][4],
                    'prevadmittedquote': dataETF['securities']['data'][i][23],
                    'currency': (dataETF['securities']['data'][i][24] == 'SUR') ? 'RUB' : dataETF['securities']['data'][i][24],
                    'last': dataETF['marketdata']['data'][i][12],
                    'change': dataETF['marketdata']['data'][i][25]
                });
            }
            
            result.etf = data;

            // request for Index
            let request2 = 'http://iss.moex.com/iss/engines/stock/markets/index/securities.json?iss.meta=off';
            Moex.getCustom(request2, (err, dataIndex) => {
                if (err) return next(err);
                let data = [];
                for (var i = 0; i < dataIndex['securities']['data'].length; i++) {
                    data.push({
                        'secid': dataIndex['securities']['data'][i][0],
                        'shortname': dataIndex['securities']['data'][i][4],
                        'annualhigh': dataIndex['securities']['data'][i][5],
                        'annuallow': dataIndex['securities']['data'][i][6],
                        'currency': (dataIndex['securities']['data'][i][7] == 'SUR') ? "RUB" : dataIndex['securities']['data'][i][7],
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

                // Render view
                res.render('quotes', {
                    title: 'Котировки',
                    data: result
                });
            });
        }); 
    });
};

exports.info = (req, res, next) => {

    let secid = req.params.secid;

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
                data: data
            });

        });
    });

};