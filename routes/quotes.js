const Moex = require('../models/moex');

exports.list = (req, res, next) => {
    Moex.getQuotes((err, response) => {
        if (err) return next(err);

        let sdata = response['securities']['data']; 
        let mdata = response['marketdata']['data'];

        res.render('quotes', {
            title: 'Quotes',
            sequrities: sdata,
            marketdata: mdata
        });
    });
};