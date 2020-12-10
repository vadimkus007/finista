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
                'boardid': sdata[i][1],
                'shortname': sdata[i][2],
                'prevprice': sdata[i][3],
                'lotsize': sdata[i][4],
                'facevalue': sdata[i][5],
                'status': sdata[i][6],
                'boardname': sdata[i][7],
                'decimals': sdata[i][8],
                'secname': sdata[i][9],
                'remarks': sdata[i][10],
                'marketcode': sdata[i][11],
                'insrtid': sdata[i][12],
                'sectorid': sdata[i][13],
                'minstep': sdata[i][14],
                'prevwaprice': sdata[i][15],
                'faceunit': sdata[i][16],
                'prevdate': sdata[i][17],
                'issuesize': sdata[i][18],
                'isin': sdata[i][19],
                'latname': sdata[i][20],
                'regnamber': sdata[i][21],
                'prevlegalcloseprice': sdata[i][22],
                'prevadmittedquote': sdata[i][23],
                'currencyid': (sdata[i][24] == 'SUR') ? 'RUB' : null,
                'sectype': sdata[i][25],
                'listlevel': sdata[i][26],
                'settledate': sdata[i][27],
                'bid': mdata[i][2],
                'biddepth': mdata[i][3],
                'offer': mdata[i][4],
                'offerdepth': mdata[i][5],
                'spread': mdata[i][6],
                'biddeptht': mdata[i][7],
                'offerdeptht': mdata[i][8],
                'open': mdata[i][9],
                'low': mdata[i][10],
                'high': mdata[i][11],
                'last': mdata[i][12],
                'lastchange': mdata[i][13],
                'lastchangeprcnt': mdata[i][14],
                'qty': mdata[i][15],
                'value': mdata[i][16],
                'value_usd': mdata[i][17],
                'waprice': mdata[i][18],
                'lastcngetolastwaprice': mdata[i][19],
                'waptoprevwapriceprcnt': mdata[i][20],
                'waptoprevwaprice': mdata[i][21],
                'closeprice': mdata[i][22],
                'marketpricetoday': mdata[i][23],
                'marketprice': mdata[i][24],
                'lasttoprevprice': mdata[i][25],
                'numtrades': mdata[i][26],
                'voltoday': mdata[i][27],
                'valtoday': mdata[i][28],
                'valtoday_usd': mdata[i][29],
                'etfsettleprice': mdata[i][30],
                'tradingstatus': mdata[i][31],
                'updatetime': mdata[i][32],
                'admittedquote': mdata[i][33],
                'lastbid': mdata[i][34],
                'lastoffer': mdata[i][35],
                'lcloseprice': mdata[i][36],
                'lcurrentprice': mdata[i][37],
                'marketprice2': mdata[i][38],
                'numbids': mdata[i][39],
                'numoffers': mdata[i][40],
                'change': mdata[i][41],
                'time': mdata[i][42],
                'highbid': mdata[i][43],
                'lowoffer': mdata[i][44],
                'priceminusprewaprice': mdata[i][45],
                'openperiodprice': mdata[i][46],
                'seqnum': mdata[i][47],
                'systime': mdata[i][48],
                'closingauctionprice': mdata[i][49],
                'closingauctionvolume': mdata[i][50],
                'issuecapitalization': mdata[i][51],
                'issuecapitalization_updatetime': mdata[i][52],
                'etfsettlecurrency': mdata[i][53],
                'valtoday_rur': mdata[i][54],
                'tradingsession': mdata[i][55]
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
                    'last': dataETF['marketdata']['data'][i][12],
                    'lasttoprevprice': dataETF['marketdata']['data'][i][25],
                    'open': dataETF['marketdata']['data'][i][9],
                    'low': dataETF['marketdata']['data'][i][10],
                    'high': dataETF['marketdata']['data'][i][11],
                    'waprice': dataETF['marketdata']['data'][i][18],
                    'valtoday': dataETF['marketdata']['data'][i][28],
                    'time': dataETF['marketdata']['data'][i][42]
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