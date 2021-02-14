const Moex = require('../../lib/moex');
const passport = require('passport');
const models = require('../../models');
const Favorite = models.Favorite;

const jwt = require('jsonwebtoken');
const config = require('../../config/config.js');

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

// Info securities get request
exports.info = (req, res, next) => {

    var secid = req.params.secid || null;
    if (!secid) {
        res.status(400).json('Bad request');
        return next();
    }

    var user = {id: 0};

    // check user in request
    const authHeader = req.headers.authorization;



    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, config.secret, (err, _user) => {
            user = _user;
        });
    }
    var data = {};
    var board = {};

    // get pri,ary board of secid
    Moex.getPrimaryBoard(secid)
    .then(result => {
        board = result;

        let request = {
            engines: board.engine,
            markets: board.market,
            boards: board.boardid,
            securities: board.secid
        }

        let options = {
            'iss.only': 'securities,marketdata'
        }

        return Moex.getRequest(request, options);

    })
    .then(results => {

        var obj = {...results.securities[0], ...results.marketdata[0]};

        data.securities = obj;

        // get history

        return Moex.getHistory(board.secid, board.boardid, board.market, board.engine);
    })
    .then(results => {
        let history = [];
        results.forEach(rows => {
            rows.forEach(row => {
                row[0] = Date.parse(row[0]);
                history.push(row);
            })
        });

        data.history = history;

        // get dividends
        let request = {
            securities: board.secid,
            dividends: ''
        }
        let options = {
            'dividends.columns': 'registryclosedate,value,currencyid'
        }

        return Moex.getRequest(request, options);
    })
    .then(results => {
        data.dividends = results.dividends;

        data.dividends.forEach(row => {
            let price = data.history.find((element, index, array) => {
                if (element[0] == Date.parse(row.registryclosedate)) {
                    return true;
                }
                return false;
            });
            if (typeof price !== 'undefined') {
                row.price = price[1];
                row.yield = 100 * row.value / row.price;
            }
        });

        // get favorite
        return Favorite.findOne({
            where: {
                userId: user.id, 
                secid: board.secid
            },
            raw: true
        });
    })
    .then(favorites => {

        if (favorites) {
            data.favorite = true;
        } else {
            data.favorite = false;
        }

        if (user.id == 0) {
            data.favorite = null;
        }

        res.json({
            securities: data.securities,
            history: data.history,
            dividends: data.dividends,
            favorite: data.favorite
        });


    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
        return next(err);
    })

}

// toggle favorites
exports.toggleFavorite = (req, res, next) => {
    
    const secid = req.params.secid || null;

    // check user in request
    const authHeader = req.headers.authorization;

    var user = null;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, config.secret, (err, _user) => {
            user = _user;
        });
    }

    if (!user) {
        res.status(401).json({ message: 'Anauthorized' });
        return next();
    }
console.log('USER', user);
    if (user && secid) {
        
        Favorite.findOne({
            where: {userId: user.id, secid: secid},
            raw: true
        })
        .then(row => {
            if (row) {
                // delete record from favorites
                Favorite.destroy({
                    where: {
                        id: row['id']
                    }
                })
                .then(count => {
                    res.json({ 
                        favorite: false,
                        message: 'Record successfully deleted'
                    });
                    return next();
                })
                .catch(err => {
                    console.log('Error: ', err);
                    res.json({ error: err });
                    next(err);
                });
            } else {
                // Add new favorite
                Favorite.create({
                    secid: secid,
                    userId: user.id
                })
                .then((newFavorite) => {
                    console.log(`newFavorite['secid']) added to favorites.`);
                    res.json({ 
                        favorite: true,
                        message: 'Record successfully added'
                    })
                    return next();
                })
                .catch(err => {
                    console.log('Error while creation new favorite');
                    res.json({ error: err });
                    next(err);
                });
                
            }
        }).catch(err => {
            console.log('Error getting request from db: ', err);
            res.json({ error: err });
            next(err);
        })

    }
}