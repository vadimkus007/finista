const Moex = require('../lib/moex');
const models = require('../models');
const Favorite = models.Favorite;

// var Highcharts = require('highcharts/highstock');

var exports = module.exports = {}

exports.list = (req, res, next) => {    
    // get User from request
    let user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    }

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
 
//console.log('BONDS', result.bonds);

        // Render view
        res.render('quotes', {
            title: 'Котировки',
            user: user,
            data: result
        });

    }).catch(err => {
        console.log(err);
        next(err);
    }); // promises
} // list 


exports.info = (req, res, next) => {

    // remove portfolio id from session
    //if (req.session && req.session.portfolio !== null) {
    //    delete req.session.portfolio;
    //}

    var data = {};
    data.secid = req.params.secid;

    var user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    };

    // Get boards info e.g. engines, markets, boards 
    let url = `http://iss.moex.com/iss/securities/${data.secid}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine`;

    Moex.fetchJSON(url)
    .then(result => {
        for (key in result.boards.columns) {
            data[result.boards.columns[key]] = result.boards.data[0][key];
        }

        // get security info
        let url = `http://iss.moex.com/iss/engines/${data.engine}/markets/${data.market}/boards/${data.boardid}/securities/${data.secid}.json?iss.meta=off&iss.only=securities,marketdata`;
        return Moex.fetchJSON(url)
    })
    .then(row => {

        // parse obtained data
        for (key in row.securities.columns) {
            data[row.securities.columns[key]] = row.securities.data[0][key];
        }
        for (key in row.marketdata.columns) {
            data[row.marketdata.columns[key]] = row.marketdata.data[0][key];
        }

        // get History data
        return Moex.getHistory(data.secid, data.boardid, data.market, data.engine)
    })

    .then(result => {

        var candles = [];
        result.forEach(items => {
            items.forEach(item => {
                item[0] = Date.parse(item[0]); // Date in milliseconds format
                candles.push(item);
            });
        });
                
        data['candles'] = candles; // [ date, price ] format

console.log('DATA', data);
                // Dividends
                // Moex.getCustom(`https://iss.moex.com/iss/securities/${data['SECID']}/dividends.json?iss.meta=off&dividends.columns=registryclosedate,value`, (err, result) => {

        return Moex.fetchJSON(`https://iss.moex.com/iss/securities/${data['SECID']}/dividends.json?iss.meta=off&dividends.columns=registryclosedate,value`)
    })
    .then(result => {
                    
        data['dividends'] = result['dividends']['data'];

        // get prices to given dates
        let urls = [];
        let baseURL = `http://iss.moex.com/iss/history/engines/${data.engine}/markets/${data.market}/boards/${data.boardid}/securities/${data.secid}.json?iss.meta=off&history.columns=TRADEDATE,CLOSE`;
                    
        data['dividends'].forEach(item => {
            urls.push(baseURL + '&from=' + item[0] + '&till=' + item[0]);
        });

        let promises = urls.map(url => Moex.fetchJSON(url));

        return Promise.all(promises)
    })
    .then(responses => {
        for (var i = 0; i < responses.length; i++) {
            if (responses[i]['history']['data'].length > 0) {
                data['dividends'][i].push(responses[i]['history']['data'][0][1]);
            } else {
                data['dividends'][i].push('');
            }
            let div = data['dividends'][i][1];
            let price = data['dividends'][i][2];
            let dy = 100 * div / price;

            data['dividends'][i].push(dy.toFixed(1));
        };

                        // get Favorite info

        return Favorite.findOne({
                            where: {userId: user, secid: data['SECID']},
                            raw: true
                        })
    })
    .then((rows) => {

        let favorite = false;

        if (rows) {
            if (rows['secid'] === data['SECID']) {favorite = true};
        }

/*
Moex.getHistoryFromDate('AFLT', 'TQBR', 'shares', 'stock', '2020-07-13', (err, result) => {
    console.log(result);
});
*/
//console.log('DATA', data);
        res.render('quote', {
            title: 'Информация об инструменте', 
            user: user,
            favorite: favorite,
            data: data
        });  // render


    })
    .catch(err => {
        console.log('Error getting request from MOEX: ', err);
        next(err);
    });

}

exports.favorite = (req, res, next) => {
    var secid = req.params.secid;
    var user = 0;
    if (req.isAuthenticated()) {user = req.session.passport.user};

    if (user && secid) {
        
        Favorite.findOne({
            where: {userId: user, secid: secid},
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
                .then(count => {console.log('Record successfully deleted.')})
                .catch(err => {
                    console.log('Error: ', err);
                    next(err);
                });
            } else {
                // Add new favorite
                Favorite.create({
                    secid: secid,
                    userId: user
                })
                .then((newFavorite) => {console.log(`newFavorite['secid']) added to favorites.`)})
                .catch(err => console.log('Error while creation new favorite'));
                
            }
        }).catch(err => {
            console.log('Error getting request from db: ', err);
            next(err);
        })

    }

    res.redirect(`/quotes/${req.params.secid}`);
}