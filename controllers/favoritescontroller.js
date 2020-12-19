const models = require('../models');
const Favorite = models.Favorite;
const Moex = require('../lib/moex');

var exports = module.exports = {}

exports.list = (req, res, next) => {

    // get User from request
    var user = 0;

    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    }

    Favorite.findAll({
        where: {userId: user},
        raw: true
    })
    .then((rows) => { // Result processing

        // get boards infor for all securities
        let urls = [];
        
        for (var i = 0; i<rows.length; i++) {
            let url = `http://iss.moex.com/iss/securities/${rows[i].secid}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine`;
            urls.push(url); 
        }
            
        let promises = urls.map(index => Moex.fetchJSON(index));
            
        Promise.all(promises)
        .then(responses => {
            
            for (var i = 0; i<rows.length; i++) {
                let resp = responses[i];
                for (key in resp.boards.columns) {
                    rows[i][resp.boards.columns[key]] = resp.boards.data[0][key];
                }
            }

            // get market info for all securities

            let urls = [];
            for (var i = 0; i<rows.length; i++) {
                let url = `http://iss.moex.com/iss/engines/${rows[i].engine}/markets/${rows[i].market}/boards/${rows[i].boardid}/securities/${rows[i].secid}.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,CURRENCYID&marketdata.columns=LAST,LASTTOPREVPRICE,UPDATETIME`;
                urls.push(url);
            }

            let promises = urls.map(url => Moex.fetchJSON(url));

            Promise.all(promises)
            .then((responses) => {

                for (var i = 0; i<rows.length; i++) {
                    let securities = responses[i].securities;
                    let marketdata = responses[i].marketdata;
                    for (key in securities.columns) {
                        rows[i][securities.columns[key]] = securities.data[0][key];
                    }
                    for (key in marketdata.columns) {
                        rows[i][marketdata.columns[key]] = marketdata.data[0][key];
                    }
                }

                res.render('favorites', {
                    title: 'Избранное',
                    user: user,
                    data: rows
                }); // render view
            })
            .catch(err => console.log('Error reading security data: ', err));

        })
        .catch(error => console.log('Error: ', error));  
    })
    .catch((err) => {
        console.log('Error reading favorites: ', err);
    });

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
            break;

        default:
            res.redirect('favorites');
    }

    res.redirect('favorites');
}