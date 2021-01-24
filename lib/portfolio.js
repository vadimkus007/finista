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
                include: [
                    {
                        model: ModelPortfolio,
                        as: 'portfolio',
                        attributes: [],
                        required: false
                    }
                ],
                raw: true,
                where: {
                    [Op.and]: [
                        {'portfolioId' : portfolioId},
                        sequelize.literal('`Trade`.`secid` <> `portfolio`.`currency`'),
                        sequelize.where(sequelize.fn('date', sequelize.col('date')), '<=', date)
                    ]
                }
            })
        } else {
            return Trade.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('secid')), 'secid']],
                include: [
                    {
                        model: ModelPortfolio,
                        as: 'portfolio',
                        attributes: [],
                        required: false
                    }
                ],
                raw: true,
                where: {
                    [Op.and]: [
                        {'portfolioId' : portfolioId},
                        sequelize.literal('`Trade`.`secid` <> `portfolio`.`currency`')
                    ]
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

    static _getTrades(portfolioId, date) {
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


    /* get cumulative Trades info for given year
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
    static getTradesYear(portfolioId, year) {

            return Trade.findAll({
                where: {
                    [Op.and]: [
                        {'portfolioId' : portfolioId},
                        sequelize.where(sequelize.fn('year', sequelize.col('date')), '=', year)
                    ]
                },
                order: [
                    ['operationId', 'ASC'], 
                    ['secid', 'ASC']
                ],
                raw: true
            });
    } // getTradesYear

    static _getTradesYear(portfolioId, year) {

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
                        sequelize.where(sequelize.fn('year', sequelize.col('date')), '=', year)
                    ]
                },
                order: [
                    ['operationId', 'ASC'], 
                    ['secid', 'ASC']
                ],
                raw: true
            });
    } // getTradesYear

    /* getCashe = function
        returns cashe
    */
    static getCashe(portfolioId, date) {
        var cashe = {};
        var self = this;
        return new Promise((resolve, reject) => {

            self.getTrades(portfolioId, date)
            .then(trades => {
                var _cashe = 0;
                trades.forEach(trade => {

// console.log('PORTFOLIO.TRADES', trade);

                    switch(trade.operationId) {
                        case 1:
                            if (trade.secid === 'RUB') {
                                _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            } else {
                                _cashe = _cashe - Number(trade.price*trade.amount) - Number(trade.comission);
                            }
                            break;
                        case 2:
                            if (trade.secid === 'RUB') {
                                _cashe = _cashe - Number(trade.price*trade.amount) - Number(trade.comission);
                            } else {
                                _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            }
                            break;
                        case 3:
                            if (trade.secid !== 'RUB') {
                                _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            }
                            break;
                        case 4:
                            _cashe = _cashe + Number(trade.price*trade.amount*trade.value/100) - Number(trade.comission);
                            break;
                        case 5:
                            _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            break;
                        case 6:
                            _cashe = _cashe + Number(trade.price*trade.amount) - Number(trade.comission);
                            break;
                        case 7:
                            _cashe = _cashe - Number(trade.value*trade.price*trade.amount/100) - Number(trade.accint*trade.amount) - Number(trade.comission);
                            break;
                        case 8:
                            _cashe = _cashe + Number(trade.value*trade.price*trade.amount/100) - Number(trade.accint*trade.amount) - Number(trade.comission);
                            break;

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

    static getIncomeYear(portfolioId, year) {
            if (typeof year !== 'undefined') {
                return Trade.findAll({
                    attributes: [
                        [sequelize.fn('sum', sequelize.literal('`Trade`.`price`*`Trade`.`amount` - `Trade`.`comission`')), 'income']
                    ],
                    include: [
                        {
                            model: ModelPortfolio,
                            as: 'portfolio',
                            attributes: [],
                            required: false
                        }
                    ],
                    where: {
                        [Op.and]: [
                            {'portfolioId' : portfolioId},
                            sequelize.literal('`Trade`.`secid` = `portfolio`.`currency`'),
                            {'operationId': 1},
                            sequelize.where(sequelize.fn('year', sequelize.col('date')), '=', year)
                        ]
                    },
                    raw: true
                });
            } else {
                return Trade.findAll({
                    attributes: [
                        [sequelize.fn('sum', sequelize.literal('`Trade`.`price`*`Trade`.`amount` - `Trade`.`comission`')), 'income']
                    ],
                    include: [
                        {
                            model: ModelPortfolio,
                            as: 'portfolio',
                            attributes: [],
                            required: false
                        }
                    ],
                    where: {
                        [Op.and]: [
                            {'portfolioId' : portfolioId},
                            sequelize.literal('`Trade`.`secid` = `portfolio`.`currency`'),
                            {'operationId': 1}
                        ]
                    },
                    raw: true
                });
            }     
    } // getIncomeYear


    static getOutcomeYear(portfolioId, year) {
            if (typeof year !== 'undefined') {
                return Trade.findAll({
                    attributes: [
                        [sequelize.fn('sum', sequelize.literal('`Trade`.`price`*`Trade`.`amount` - `Trade`.`comission`')), 'outcome']
                    ],
                    include: [
                        {
                            model: ModelPortfolio,
                            as: 'portfolio',
                            attributes: [],
                            required: false
                        }
                    ],
                    where: {
                        [Op.and]: [
                            {'portfolioId' : portfolioId},
                            sequelize.literal('`Trade`.`secid` = `portfolio`.`currency`'),
                            {'operationId': 2},
                            sequelize.where(sequelize.fn('year', sequelize.col('date')), '=', year)
                        ]
                    },
                    raw: true
                });
            } else {
                return Trade.findAll({
                    attributes: [
                        [sequelize.fn('sum', sequelize.literal('`Trade`.`price`*`Trade`.`amount` - `Trade`.`comission`')), 'outcome']
                    ],
                    include: [
                        {
                            model: ModelPortfolio,
                            as: 'portfolio',
                            attributes: [],
                            required: false
                        }
                    ],
                    where: {
                        [Op.and]: [
                            {'portfolioId' : portfolioId},
                            sequelize.literal('`Trade`.`secid` = `portfolio`.`currency`'),
                            {'operationId': 2}
                        ]
                    },
                    raw: true
                });
            }     
    } // getIncomeYear

    static getComission(portfolioId, date) {

        if (typeof date === 'undefined') {
            var date = moment().format('YYYY-MM-DD');
        }


        return Trade.findAll({
            attributes: [
                [sequelize.fn('sum', sequelize.col('comission')), 'comission']
            ],
            where: {
                [Op.and]: [
                    {'portfolioId': portfolioId},
                    sequelize.where(sequelize.fn('date', sequelize.col('date')), '<=', date)
                ]
            },
            raw: true
        });
    } // getComission

    static getComissionYear(portfolioId, year) {

        if (typeof year !== 'undefined') {
            return Trade.findAll({
                attributes: [
                    [sequelize.fn('sum', sequelize.col('comission')), 'comission']
                ],
                where: {
                    [Op.and]: [
                        {'portfolioId': portfolioId},
                        sequelize.where(sequelize.fn('year', sequelize.col('date')), '=', year)
                    ]
                },
                raw: true
            });
        } else {
            return Trade.findAll({
                attributes: [
                    [sequelize.fn('sum', sequelize.col('comission')), 'comission']
                ],
                where: {
                    'portfolioId': portfolioId
                },
                raw: true
            });
        }  
    } // getComissionYears

    // getRubs
    static getRubs(portfolioId) {
        return Trade.findAll({
            attributes: [
                'date',
                'operationId',
                'price',
                'amount',
                'comission' 
            ],
            include: [
                {
                    model: ModelPortfolio,
                    as: 'portfolio',
                    attributes: [],
                    required: false
                }
            ],
            where: {
                    [Op.and]: [
                        {'portfolioId': portfolioId},
                        sequelize.literal('`Trade`.`secid` = `portfolio`.`currency`')
                    ]
                },
            raw: true
        });
    } // getRubs for XIRR

    static getSecidOperations(portfolioId, secid, date) {
        return Trade.findAll({
            attributes: [
                'secid',
                'date',
                'operationId',
                'price',
                'amount',
                'value',
                'accint',
                'comission'
            ],
            where: {
                'portfolioId': portfolioId,
                'secid': secid
            },
            raw: true
        });
    } // getSecidOperations

    static getSecidOperationsYear(portfolioId, secid, year) {
        return Trade.findAll({
            attributes: [
                'secid',
                'date',
                'operationId',
                'price',
                'amount',
                'value',
                'accint',
                'comission'
            ],
            where: {
                [Op.and]: [
                    {'portfolioId': portfolioId},
                    {'secid': secid},
                    sequelize.where(sequelize.fn('year', sequelize.col('date')), '=', year)
                ]
            },
            order: [ 
                    ['date', 'ASC']
                ],
            raw: true
        });
    }

    /*
        secids = array [{secid: name}, ...]
    */
    static getSecidsOperations(portfolioId, secids, date) {
        var promises = [];
        secids.forEach(secid => {
            promises.push(this.getSecidOperations(portfolioId, secid.secid, date));
        });
        return Promise.all(promises);
    } //getSecidsOperations

    /*
        secids = array [{secid: name}, ...]
    */
    static getSecidsOperationsYear(portfolioId, secids, year) {
        var promises = [];
        secids.forEach(secid => {
            promises.push(this.getSecidOperationsYear(portfolioId, secid.secid, year));
        });
        return Promise.all(promises);
    }

    /*
        getSecidAmount(secid, date)
        returns {secid: NAME, amount: amount}
    */
    static getSecidAmount(portfolioId, secid, date) {
        
        return new Promise((resolve, reject) => {
            this.getTrades(portfolioId, date)
            .then(trades => {
                let amount = 0;
                trades.forEach(trade => {
                    if (trade.secid == secid) {
                        if (trade.operationId == 1) {
                            amount = amount + Number(trade.amount);
                        }
                        if (trade.operationId == 2) {
                            amount = amount - Number(trade.amount);
                        }
                        if (trade.opeartionId == 4) {
                            amount = amount - Number(trade.amount);
                        }
                        if (trade.opeartionId == 7) {
                            amount = amount + Number(trade.amount);
                        }
                        if (trade.opeartionId == 8) {
                            amount = amount - Number(trade.amount);
                        }
                    }
                });
                resolve({
                    'secid': secid,
                    'amount': amount
                });
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
        });
    } // getSecidAmount

    static _getSecidsAmount(portfolioId, secids, date) {
        let promises = [];
        secids.forEach(secid => {
            promises.push(this.getSecidAmount(portfolioId, secid.secid, date));
        });
        return Promise.all(promises);
    } // getSecidsAmount

    static getSecidsAmount(portfolioId, secids, date) {
        var _self = this;
        return new Promise((resolve, reject) => {
            _self.getTrades(portfolioId, date)
            .then(trades => {
                let result = [];
                secids.forEach(secid => {
                    let amount = 0;
                    trades.forEach(trade => {
                        if (trade.secid == secid.secid) {
                            if (trade.operationId == 1) {
                                amount = amount + Number(trade.amount);
                            }
                            if (trade.operationId == 2) {
                                amount = amount - Number(trade.amount);
                            }
                            if (trade.operationId == 4) {
                                amount = amount - Number(trade.amount);
                            }
                            if (trade.operationId == 7) {
                                amount = amount + Number(trade.amount);
                            }
                            if (trade.operationId == 8) {
                                amount = amount - Number(trade.amount);
                            }
                        }
                    });
                    result.push({
                        'secid': secid.secid,
                        'amount': amount
                    });
                });
                resolve(result);
            })
            .catch(err => {
                reject(err);
            })
        })
    } // getSecidsAmount
    
}

module.exports = Portfolio;