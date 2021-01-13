const sequelize = require('sequelize');
const Op = sequelize.Op;

const models = require('../models');
const ModelPortfolio = models.Portfolio;
const Trade = models.Trade;

var moment = require('moment');
var xirr = require('xirr');

// Class for getting quotes from MOEX API
class Portfolio {

    constructor(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }

    // Get Portfolio 
    static getPortfolio(id) {
        return ModelPortfolio.findOne({
            where: {
                id: id
            },
            raw: true
        })
    }

    /* get secids
        returns list of secids to date
        if date is not defined returns all secids in portfolioId
        except 'RUB'
    */
    static getSecids(portfolioId, date) {
        if (typeof date !== 'undefined') {
            return Trade.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('secid')), 'secid']],
                raw: true,
                where: {
                    [Op.and]: [
                        {'portfolioId' : portfolioId},
                        {
                            'secid': {
                                [Op.ne]: 'RUB'
                            }
                        },
                        sequelize.where(sequelize.fn('date', sequelize.col('date')), '<=', date)
                    ]
                }
            })
        } else {
            return Trade.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('secid')), 'secid']],
                raw: true,
                where: {
                    'portfolioId' : portfolioId,
                    'secid': {
                        [Op.ne]: 'RUB'
                    }
                }
            })
        }
    }

    /* get cumulative Trades info
        returns list of total trades info in a format:
        [{
            secid: text,
            operationId: int,
            sum: number
            comission: number,
            amount: int
        }]
        including 'RUB'
    */
    static getTrades(portfolioId, date) {
        if (typeof date !== 'undefined') {
            return Trade.findAll({
                attributes: [
                    'secid',
                    'operationId',
                    [sequelize.fn('sum', sequelize.literal('(`price`*`amount`)')), 'sum'],
                    [sequelize.fn('sum', sequelize.col('comission')), 'comission'],
                    [sequelize.fn('sum', sequelize.col('amount')), 'amount']
                ],
                group: ['secid', 'operationId'],
                where: {
                    [Op.and]: [
                        {'portfolioId' : portfolioId},
                        sequelize.where(sequelize.fn('date', sequelize.col('date')), '<=', date)
                    ]
                },
                order: [
                    ['operationId', 'ASC'], 
                    ['secid', 'ASC']
                ],
                raw: true
            });
        } else {
            return Trade.findAll({
                attributes: [
                    'secid',
                    'operationId',
                    [sequelize.fn('sum', sequelize.literal('(`price`*`amount`)')), 'sum'],
                    [sequelize.fn('sum', sequelize.col('comission')), 'comission'],
                    [sequelize.fn('sum', sequelize.col('amount')), 'amount']
                ],
                group: ['secid', 'operationId'],
                where: {
                    'portfolioId' : portfolioId
                },
                order: [
                    ['operationId', 'ASC'], 
                    ['secid', 'ASC']
                ],
                raw: true
            });
        }
    } // getTrades

    /* getCashe = function
        returns cashe
    */
    static getCashe(portfolioId) {
        var cashe = {};
        var self = this;
        return new Promise((resolve, reject) => {

            self.getTrades(portfolioId)
            .then(trades => {
                var _cashe = 0;
                trades.forEach(trade => {
                    switch(trade.operationId) {
                        case 1:
                            if (trade.secid === 'RUB') {
                                _cashe = _cashe + Number(trade.sum) - Number(trade.comission);
                            } else {
                                _cashe = _cashe - Number(trade.sum) - Number(trade.comission);
                            }
                            break;
                        case 2:
                            if (trade.secid === 'RUB') {
                                _cashe = _cashe - Number(trade.sum) - Number(trade.comission);
                            } else {
                                _cashe = _cashe + Number(trade.sum) - Number(trade.comission);
                            }
                        case 3:
                            if (trade.secid !== 'RUB') {
                                _cashe = _cashe + Number(trade.sum) - Number(trade.comission);
                            }
                    }
                });

                cashe.cashe = _cashe.toFixed(2);
                resolve(cashe);

            })
            .catch(error => {
                console.log(error);
                reject(error)
            });

        });   
    } // getCashe

    
    
}

module.exports = Portfolio;