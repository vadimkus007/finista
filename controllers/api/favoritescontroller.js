const models = require('../../models');
const Favorite = models.Favorite;
const Moex = require('../../lib/moex');

var exports = module.exports = {};

const parseData = (data => { 
    return new Promise((resolve, reject) => {
        let securities = {};
        for (var key in data.securities[0]) {
            let newKey = key.toLowerCase();
            securities[newKey] = data.securities[0][key];
        }
        let marketdata = {};
        for (var key in data.marketdata[0]) {
            let newKey = key.toLowerCase();
            marketdata[newKey] = data.marketdata[0][key];
        }

        let obj = {...securities, ...marketdata};
        resolve(obj);
    });
});

exports.list = (req, res, next) => {

    const user = req.user.dataValues;

    var data = {};

    Favorite.findAll({
        where: {
            userId: user.id
        },
        raw: true
    })
    .then(favorites => {
        data.favorites = favorites;

        let promises = [];
        favorites.forEach(favorite => {
            promises.push(Moex.getPrimaryBoard(favorite.secid).then(board => Moex.getLastPrice(board)).then(data => parseData(data)));
        });

        return Promise.all(promises);
    })
    .then(prices => {

        var arr = [];

        data.favorites.forEach(favorite => {
            let obj = prices.find((element) => {
                return (favorite.secid === element.secid) ? true : false;
            });
            let newObj = {...favorite, ...obj};
            arr.push(newObj);
        });

        arr.sort((a,b) => b.lasttoprevprice - a.lasttoprevprice);

        data.favorites = arr;

// console.log(data);

        res.json({
            favorites: data.favorites
        });

    })
    .catch(err => {
        console.log(err);
        res.status(500).json({message: 'Internal server error'});
    });

}

exports.delete = (req, res, next) => {

    if (req.body.id) {
        Favorite.destroy({
            where: {
                id: req.body.id
            }
        })
        .then(rowDeleted => {
            if (rowDeleted > 0) {
                console.log(`Deleted ${rowDeleted} items from Favorites`);
                return res.json({
                    message: 'Successfully deleted'
                });
            }
        })
        .catch(err => {
            console.log(err);
            return res.json(err);
        });
    }

    

}