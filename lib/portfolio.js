const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;

// Class for getting quotes from MOEX API
class Portfolio {

    constructor(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }

    static getPortfolio(id) {
        return Portfolio.findOne({
            where: {
                id: id
            },
            raw: true
        })
    }

    
}

module.exports = Portfolio;