const Moex = require('../../lib/moex');

var exports = module.exports = {}

exports.list = (req, res, next) => {

    var result = {};

    let request = {
        engines: 'stock',
        markets: 'shares',
        boards: 'TQBR',
        securities: ''
    };
    let options = {
        'iss.only': 'securities,marketdata'
    }

    let promises = [];

    promises.push(Moex.getRequest(request, options));

    request.markets = 'foreignshares';
    request.boards = 'FQBR';

    promises.push(Moex.getRequest(request, options));

    request.markets = 'shares';
    request.boards = 'TQTF';
    // request.boardgroups = '57';

    promises.push(Moex.getRequest(request, options));

    request.markets = 'index';
    request.boards = 'rtsi';

    promises.push(Moex.getRequest(request, options));

    request.boards = 'sndx';

    promises.push(Moex.getRequest(request, options));

    // bonds (boardgroup = 58)
    request = {};
    request = {
        engines: 'stock',
        markets: 'bonds',
        boardgroups: '58',
        securities: '' 
    };

    promises.push(Moex.getRequest(request, options));

    Promise.all(promises)
    .then(data => {

        let section_keys = ['stock', 'stock', 'etf', 'index', 'index', 'bonds'];

        // append data obtained
        let result = {};

        result.shares = data[0];
        result.shares.securities = result.shares.securities.concat(data[1].securities);
        result.shares.marketdata = result.shares.marketdata.concat(data[1].marketdata);

        result.etf = data[2];

        result.index = data[3];
        result.index.securities = result.index.securities.concat(data[4].securities);
        result.index.marketdata = result.index.marketdata.concat(data[4].marketdata);

        //bonds
        result.bonds = data[5];
        

        let arr = [];
        for (var i=0; i<result.shares.securities.length; i++) {
            let obj = {};
            arr.push(Object.assign(result.shares.securities[i], result.shares.marketdata[i]));
        }
        result.shares = arr;
        arr = [];
        for (var i=0; i<result.etf.securities.length; i++) {
            let obj = {};
            arr.push(Object.assign(result.etf.securities[i], result.etf.marketdata[i]));
        }
        result.etf = arr;
        arr = [];
        for (var i=0; i<result.index.securities.length; i++) {
            let obj = {};
            arr.push(Object.assign(result.index.securities[i], result.index.marketdata[i]));
        }
        result.index = arr;

        // bonds
        arr = [];
        for (var i=0; i<result.bonds.securities.length; i++) {
            let obj = {};
            arr.push(Object.assign(result.bonds.securities[i], result.bonds.marketdata[i]));
        }
        result.bonds = arr;
 
// console.log('BONDS', result.bonds);
// console.log('ETF', result.etf);

        // send json
        res.json({
            data: result
        });

    }).catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
        return next(err);
    }); // promises
}