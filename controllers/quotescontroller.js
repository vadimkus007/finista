const Moex = require('../lib/moex');
const models = require('../models');
const Favorite = models.Favorite;

// var Highcharts = require('highcharts/highstock');

var exports = module.exports = {}


// get Board Info e.g. engine, market, board, secid
const getBoardInfo = function(secid) {
    let urls = [];
    let url = `http://iss.moex.com/iss/securities/${secid}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine`;
    urls.push(url);

    let promises = urls.map(index => Moex.fetchJSON(index));
   return Promise.all(promises)
}

// get security info
const getSecurityInfo = function(boards) {
    let urls = [];
        let url = `http://iss.moex.com/iss/engines/${boards.engine}/markets/${boards.market}/boards/${boards.boardid}/securities/${boards.secid}.json?iss.meta=off&iss.only=securities,marketdata`;
        urls.push(url);

        let promises = urls.map(index => Moex.fetchJSON(index));
        return Promise.all(promises)
}

//get history
const getHistory = function(boards, from, till, start) {
    let baseURL = `http://iss.moex.com/iss/history/engines/${boards.engine}/markets/${boards.market}/boards/${boards.boardid}/securities/${boards.secid}.json?iss.meta=off&history.columns=TRADEDATE,CLOSE`;

    // get dates from 3 year before to today
    var today = new Date();
    var start = new Date();
    start= start.setMonth(start.getMonth() - 36); // -3 years from

    baseURL = baseURL + '&from=' + formatDate(start) + '&till=' + formatDate(today);
        
    let total = 1080;
    let pagesize = 100;

    let urls = [];
    for (var i = 0; i < total; i = i+pagesize) {
        urls.push(baseURL + '&start=' + String(i));
    }

    let promises = urls.map(url => Moex.fetchJSON(url));

    var data = [];
    let histories = {};
            
    return Promise.all(promises)
}

// get dividends
const getDividends = function(secid) {
    let urls = [`https://iss.moex.com/iss/securities/${secid}/dividends.json?iss.meta=off&dividends.columns=registryclosedate,value`];
    let promises = urls.map(url => Moex.fetchJSON(url));
}

exports.list = (req, res, next) => {
    
    var result = {};

    // get shares (TQBR)
    let urls = [];
    let url = 'http://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities,marketdata';
    urls.push(url);
    url = 'http://iss.moex.com/iss/engines/stock/markets/foreignshares/boards/FQBR/securities.json?iss.meta=off&iss.only=securities,marketdata';
    urls.push(url);
    url = 'http://iss.moex.com/iss/engines/stock/markets/shares/boards/TQTF/securities.json?iss.meta=off&iss.only=securities,marketdata';
    urls.push(url);
    url = 'http://iss.moex.com/iss/engines/stock/markets/index/boards/rtsi/securities.json?iss.meta=off&iss.only=securities,marketdata'
    urls.push(url);
    url = 'http://iss.moex.com/iss/engines/stock/markets/index/boards/sndx/securities.json?iss.meta=off&iss.only=securities,marketdata'
    urls.push(url);

    let promises = urls.map(index => Moex.fetchJSON(index));
    Promise.all(promises)
    .then(data => {

        let result = {};
        let section_keys = ['stock', 'stock', 'etf', 'index', 'index'];

        // parse obtained data
        for (var index = 0; index<data.length; index++) {

            let data_array = [];
            for (var i = 0; i<data[index].securities.data.length; i++) {
                let newData = {};
                for (key in data[index].marketdata.columns) {
                    newData[data[index].marketdata.columns[key]] = data[index].marketdata.data[i][key];
                }
                for (key in data[index].securities.columns) {
                    newData[data[index].securities.columns[key]] = data[index].securities.data[i][key];
                }
                data_array.push(newData);    
            } // data arrays of securities index

            if (result[section_keys[index]]) {
                result[section_keys[index]] = result[section_keys[index]].concat(data_array);
            } else {
                result[section_keys[index]] = data_array;
            }


        } // section

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

    }).catch(err => console.log(err)); // promises
} // list 


exports.info = (req, res, next) => {

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
    .catch(err => console.log('Error getting request from MOEX: ', err));

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
                .catch(err => console.log('Error: ', err));
            } else {
                // Add new favorite
                Favorite.create({
                    secid: secid,
                    userId: user
                })
                .then((newFavorite) => {console.log(`newFavorite['secid']) added to favorites.`)})
                .catch(err => console.log('Error while creation new favorite'));
                
            }
        }).catch(err => console.log('Error getting request from db: ', err))

    }

    

    res.redirect(`/quotes/${req.params.secid}`);
}