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
        
        let promises = [];
        rows.forEach(row => {
            promises.push(Moex.getPrimaryBoard(row.secid));
        });
            
        return Promise.all(promises)
    })
    .then(boards => {      
            // get market info for all securities

        let request = {};
        let options = {
            'iss.only': 'securities,marketdata',
            'securities.columns': 'SECID,SHORTNAME,CURRENCYID',
            'marketdata.columns': 'LAST,LASTTOPREVPRICE,UPDATETIME'
        };

        let promises = [];
        boards.forEach(board => {
            request.engines = board.engine,
            request.markets = board.market,
            request.boards = board.boardid,
            request.securities = board.secid
            promises.push(Moex.getRequest(request, options));
        });

        return Promise.all(promises);
    })
    .then((responses) => {

        for (var i = 0; i<data.length; i++) {
            Object.assign(data[i],responses[i].securities[0],responses[i].marketdata[0]);
        }
        // render view

        res.render('favorites', {
            title: 'Избранное',
            user: user,
            data: data
        }); // render view

    })
    .catch(err => {
        console.log('Error reading data: ', err);
        next(err);
    });

}

exports.action = (req, res, next) => {

    var user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    }

    switch (req.body.action) {

        case 'delete':

console.log('DELETE');
console.log('\nDELETE', req.body);
        // Delete Favorites rows
            if (req.body.secid) {
                    Favorite.destroy({
                        where: {
                            id: req.body.secid
                        }
                    })
                    .then(rowDeleted => {
                        if (rowDeleted > 0) {
                            console.log(`Deleted ${rowDeleted} items from Favorites`);
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        next(err);
                    });
            }
            res.redirect('favorites');
            break;

        default:
            res.redirect('favorites');
    }
}