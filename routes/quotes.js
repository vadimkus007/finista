const Moex = require('../models/moex');

exports.list = (req, res, next) => {
    let request = {
        "engine": 'stock',
        "market": 'shares',
        "board": 'TQBR'
    };
    Moex.getSequrities(request, (err, response) => {
        if (err) return next(err);

        let hostname = `${req.hostname}:3000`;

        let sdata = response['securities']['data']; 
        let mdata = response['marketdata']['data'];

        res.render('quotes', {
            title: 'Quotes',
            sequrities: sdata,
            marketdata: mdata,
            hostname: hostname,
            board: request['board']
        });
    });
};

exports.info = (req, res, next) => {

    let secid = req.params.secid;

    Moex.getBoardsInfo(secid, (err, response) => {
        if (err) return next(err);

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
                title: 'Information', 
                data: data
            });

        });
    });

};