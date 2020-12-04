const Moex = require('../models/moex');

exports.list = (req, res, next) => {
    let request = {
        "engine": 'stock',
        "market": 'shares',
        "board": 'TQBR'
    };
    Moex.getSequrities(request, (err, response) => {
        if (err) return next(err);

        let sdata = response['securities']['data']; 
        let mdata = response['marketdata']['data'];

        console.log(sdata);

        res.render('quotes', {
            title: 'Quotes',
            sequrities: sdata,
            marketdata: mdata
        });
    });
};