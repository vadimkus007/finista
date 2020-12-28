const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;

var exports = module.exports = {}

exports.info = (req, res, next) => {

    var data = {};

    // get portfolio info
    Portfolio.findOne({
        id: req.params.id,
        raw: true
    })
    .then(portfolio => {
        if (portfolio === null) {
          console.log('Not found!');
        } 

        data.portfolio = portfolio;
        
        // render view
        res.render('portfolio/index', {
            data: data
        });

    })
    .catch(err => {
        console.log('Error reading portfolio: ', err)
    });

}

