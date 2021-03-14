const Dohod = require('../../lib/dohod');

var exports = module.exports = {};

exports.list = (req, res, next) => {

    Dohod.getDividends()
    .then(response => {

//        console.log(response);

        return res.json({
            data: response
        });

    })
    .catch(err => {
        console.log(err);

        return res.status(500).json({
            error: err.message
        });

    })

} // list