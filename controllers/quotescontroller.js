const Moex = require('../lib/moex');
const models = require('../models');
const Favorite = models.Favorite;

// var Highcharts = require('highcharts/highstock');

var exports = module.exports = {}

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


    var secid = req.params.secid;
    var markets = '';
    var engines = '';
    var boards = '';

    var user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    };

    // Get boards info e.g. engines, markets, boards 
    let urls = [];
    let url = `http://iss.moex.com/iss/securities/${data.secid}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine`;
    urls.push(url);

    let promises = urls.map(index => Moex.fetchJSON(index));
    Promise.all(promises)
    .then(result => {
        for (key in result[0].boards.columns) {
            data[result[0].boards.columns[key]] = result[0].boards.data[0][key];
        }

        // get security info
        let urls = [];
        let url = `http://iss.moex.com/iss/engines/${data.engine}/markets/${data.market}/boards/${data.boardid}/securities/${data.secid}.json?iss.meta=off&iss.only=securities,marketdata`;
        urls.push(url);

        let promises = urls.map(index => Moex.fetchJSON(index));
        Promise.all(promises)
        .then(row => {

            // parse obtained data
            for (key in row[0].securities.columns) {
                data[row[0].securities.columns[key]] = row[0].securities.data[0][key];
            }
            for (key in row[0].marketdata.columns) {
                data[row[0].marketdata.columns[key]] = row[0].marketdata.data[0][key];
            }

            // get History data
            Moex.getHistory(data.secid, data.boardid, data.market, data.engine,  (err, result) => {

                var candles = [];
                result.forEach(items => {
                    items.forEach(item => {
                        item[0] = Date.parse(item[0]); // Date in milliseconds format
                        candles.push(item);
                    });
                });
                
                data['candles'] = candles; // [ date, price ] format

                // Dividends
                Moex.getCustom(`https://iss.moex.com/iss/securities/${data['SECID']}/dividends.json?iss.meta=off&dividends.columns=registryclosedate,value`, (err, result) => {
                    
                    data['dividends'] = result['dividends']['data'];

                    // get prices to given dates
                    let urls = [];
                    let baseURL = `http://iss.moex.com/iss/history/engines/${data.engine}/markets/${data.market}/boards/${data.boardid}/securities/${data.secid}.json?iss.meta=off&history.columns=TRADEDATE,CLOSE`;
                    
                    data['dividends'].forEach(item => {
                        urls.push(baseURL + '&from=' + item[0] + '&till=' + item[0]);
                    });

                    let promises = urls.map(url => Moex.fetchJSON(url));

                    Promise.all(promises).then(responses => {
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

                        Favorite.findOne({
                            where: {userId: user, secid: data['SECID']},
                            raw: true
                        }).then((rows) => {

                            let favorite = false;

                            if (rows) {
                                if (rows['secid'] === data['SECID']) {favorite = true};
                            }

/*
Moex.getHistoryFromDate('AFLT', 'TQBR', 'shares', 'stock', '2020-07-13', (err, result) => {
    console.log(result);
});
*/

                            res.render('quote', {
                                title: 'Информация об инструменте', 
                                user: user,
                                favorite: favorite,
                                data: data
                            });  // render


                        }).catch(err => console.log('Error getting request from MOEX: ', err));

                        

                    }).catch(err => console.log('Error getting request from MOEX: ', err));

                }); // Dividends
            }); // History
        }).catch(err => console.log('Error getting request from MOEX: ', err)); // Security info
    }).catch(error => console.log('Error getting request from MOEX: ', error)); // Board info
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
                }).then(count => {console.log('Record successfully deleted.')})
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