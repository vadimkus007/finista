const models = require('../models');
const Favorite = models.Favorite;
const Moex = require('../lib/moex');

var exports = module.exports = {}

exports.list = (req, res, next) => {

    // remove portfolio id from session
    //if (req.session && req.session.portfolio !== null) {
    //    delete req.session.portfolio;
    //}

    // get User from request
    var user = 0;

    var data = [];

    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    }

    Favorite.findAll({
        where: {userId: user},
        raw: true
    })
    .then((rows) => { // Result processing

        data = rows;

        // get boards infor for all securities
        let urls = [];
        
        for (var i = 0; i<rows.length; i++) {
            let url = `http://iss.moex.com/iss/securities/${rows[i].secid}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine`;
            urls.push(url); 
        }
            
        let promises = urls.map(index => Moex.fetchJSON(index));
            
        return Promise.all(promises)
    })
    .then(responses => {

        for (var i = 0; i<data.length; i++) {
            let resp = responses[i];
            for (key in resp.boards.columns) {
                data[i][resp.boards.columns[key]] = resp.boards.data[0][key];
            }
        }

            // get market info for all securities

        let urls = [];
        for (var i = 0; i<data.length; i++) {
            let url = `http://iss.moex.com/iss/engines/${data[i].engine}/markets/${data[i].market}/boards/${data[i].boardid}/securities/${data[i].secid}.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,CURRENCYID&marketdata.columns=LAST,LASTTOPREVPRICE,UPDATETIME`;
            urls.push(url);
        }

        let promises = urls.map(url => Moex.fetchJSON(url));

        return Promise.all(promises)
    })
    .then((responses) => {

        for (var i = 0; i<data.length; i++) {
            let securities = responses[i].securities;
            let marketdata = responses[i].marketdata;
            for (key in securities.columns) {
                data[i][securities.columns[key]] = securities.data[0][key];
            }
            for (key in marketdata.columns) {
                data[i][marketdata.columns[key]] = marketdata.data[0][key];
            }
        }

        // render view
        res.render('favorites', {
            title: 'Избранное',
            user: user,
            data: data
        }); // render view
    })
    .catch(err => console.log('Error reading data: ', err));

}

exports.action = (req, res, next) => {

    switch (req.body.action) {

        case 'delete':

        // Delete Favorites rows
            if (req.body.cids) {
                req.body.cids.forEach(cid => {
                    Favorite.destroy({
                        where: {
                            id: cid
                        }
                    })
                    .then(rowDeleted => {
                        if (rowDeleted > 0) {
                            console.log(`Deleted ${rowDeleted} items from Favorites`);
                        }
                    })
                    .catch(err => console.log(err));
                });
            }
            res.redirect('favorites');
            break;

        default:
            res.redirect('favorites');
    }
}