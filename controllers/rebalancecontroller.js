const models = require('../models');
const Goal = models.Goal;

const Moex = require('../lib/moex');
const Portfolio = require('../lib/portfolio');

const moment = require('moment');

const getGoals = function(portfolioId) {
    return Goal.findAll({
        attributes: [
            'id',
            'secid',
            'amount'
        ],
        where: {
            'portfolioId': portfolioId
        },
        order: [
            ['secid', 'ASC']
        ],
        raw: true
    });
} // getGoals

const getSecurities = function() {
    let request = {
        engines: 'stock',
        markets: 'shares',
        boards: 'TQBR',
        securities: ''
    }
    let options = {
        'iss.only': 'securities',
        'securities.columns': 'SECID,SHORTNAME'
    }
    var promises = [];
    promises.push(Moex.getRequest(request, options));
    
    request.markets = 'foreignshares';
    request.boards = 'FQBR';

    promises.push(Moex.getRequest(request, options));

    request.markets = 'shares';
    request.boards = 'TQTF';

    promises.push(Moex.getRequest(request, options));

    return new Promise((resolve, reject) => {
        Promise.all(promises)
        .then(results => {
            let data = [];
            for (var i = 0; i<results.length; i++) {
                results[i].securities.forEach(record => {
                    let newRecord = {};
                    newRecord['secid'] = record.SECID;
                    newRecord['name'] = record.SHORTNAME;
                    switch(i) {
                        case 0:
                            newRecord.group = 'Акции';
                            break;
                        case 1:
                            newRecord.group = 'Акции';
                            break;
                        case 2:
                            newRecord.group = 'ETF/ПИФ';
                            break;
                        default:
                            newRecord.group = 'unknown';
                    }
                    data.push(newRecord);
                });
            }

            resolve(data);
        })
        .catch(err => reject(err));
    })
} // getSecurities for options

const deleteGoal = function(id) {
    return Goal.destroy({
        where: {
            id: id
        }
    })
}

var exports = module.exports = {}

exports.show = (req, res, next) => {
    // return to /portfolios to choose portfolio
    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }
    const user = req.session.passport.user;
    const portfolioId = req.session.portfolio.id;

    var data = {};

    Portfolio.getPortfolio(portfolioId)
    .then(portfolio => {
        data.portfolio = portfolio;

        // get secids DISTINCT from trades
        return Portfolio.getSecids(portfolioId);
    })
    .then(secids => {
        data.secids = secids;

        // get cashe
        return Portfolio.getCashe(portfolioId);
    })
    .then(cashe => {
        data.cashe = cashe.cashe;

        // get secids amount in portfolio
        return Portfolio.getSecidsAmount(portfolioId, data.secids);
    })
    .then(amounts => {
        data.amounts = amounts;

        // het Goals
        return Goal.findAll({
            attributes: [
                'secid',
                'amount'
            ],
            where: {
                'portfolioId': portfolioId
            },
            raw: true
        });
    })
    .then(goals => {
        data.goals = goals;

        // join two tables amounts = amounts <- goals 
        data.amounts.forEach(secid => {
            let index = data.goals.findIndex((element) => {
                if (secid.secid == element.secid) {return true} else {return false};
            });
            if (index !== -1) {
                secid.goal = data.goals[index].amount;
                data.goals.splice(index, 1);
            } else {
                secid.goal = '0';
            }
        });
        // add unfound elements from goals to amounts
        data.goals.forEach(secid => {
            let obj = {secid: secid.secid, amount: 0, goal:secid.amount};
            data.amounts.push(obj);
        });
        delete data.goals;

        // get Moex data
        // get boards
        let promises = [];
        data.amounts.forEach(secid => {
            promises.push(Moex.getPrimaryBoard(secid.secid));
        });

        return Promise.all(promises);
    })
    .then(boards => {
        data.boards = boards;

        // get security group
        let promises = [];
        data.amounts.forEach(secid => {
            promises.push(Moex.getSecurityGroup(secid.secid));
        });

        return Promise.all(promises);
    })
    .then(groups => {
        data.groups = groups;
        for (var i = 0; i < data.groups.length; i++) {
            if (data.groups[i].group == 'stock_shares' || data.groups[i].group == 'stock_dr') {
                data.amounts[i].group = 'share';
            }
            if (data.groups[i].group == 'stock_etf' || data.groups[i].group == 'stock_ppif') {
                data.amounts[i].group = 'etf';
            }
        };

        // get prices from Moex
        let promises = [];
        data.amounts.forEach(secid => {
            promises.push(Moex.getPrice(secid.secid));
        });
        return Promise.all(promises);
    })
    .then(prices => {
        data.prices = prices;

        for (var i = 0; i<prices.length; i++) {
            data.amounts[i].price = prices[i].price;
        }


        // get lot size
        let promises = [];
        data.boards.forEach(board => {
                    let request = {
                        engines: board.engine,
                        markets: board.market,
                        boards: board.boardid,
                        securities: board.secid
                    };
                    let options = {
                        'iss.only': 'securities',
                        'securities.columns': 'LOTSIZE'
                    };
            promises.push(Moex.getRequest(request, options));
        });
                    
        return Promise.all(promises);
    })
    .then(lotsize => {
        for (i = 0; i<lotsize.length; i++) {
            data.amounts[i].lotsize = lotsize[i].securities[0].LOTSIZE;
        }

        // sort data.amounts to secid ASC
        data.amounts.sort((a, b) => {
            if (a.secid < b.secid) {return -1}
            if (a.secid > b.secid) {return 1}
            if (a.secid == b.secid) {return 0}
        });

        // sort by categories
        data.share = [];
        data.etf = [];
        data.amounts.forEach(row => {
            if (row.group == 'share') {
                data.share.push(row);
            }
            if (row.group == 'etf') {
                data.etf.push(row);
            }
        });


        // calculate sum
        data.sumShare = 0;
        data.sumEtf = 0;

        data.share.forEach(item => {
            item.sum = item.amount * item.price;
            data.sumShare = Number(data.sumShare) + Number(item.sum);
        });
        data.etf.forEach(item => {
            item.sum = item.amount * item.price;
            data.sumEtf = Number(data.sumEtf) + Number(item.sum);
        });
        data.total = Number(data.sumShare) + Number(data.sumEtf) + Number(data.cashe);

        //calculate percents
        data.percentGoalShare = 0;
        data.percentGoalEtf = 0;

        data.percentShare = 0;
        data.percentEtf = 0;

        data.share.forEach(item => {
            item.percent = 100 * item.sum / data.sumShare; // curent percent inside group
            item.percentTotal = 100 * item.sum / data.total;
            data.percentGoalShare = Number(data.percentGoalShare) + Number(item.goal);
            item.percentGoalTotal = Number(item.goal);
            data.percentShare = Number(data.percentShare) + Number(item.percentTotal);

            //sum of goal
            item.sumGoal = Number(item.percentGoalTotal * data.total / 100);
            item.difference = Number(item.sumGoal) - Number(item.sum);
        });
        data.etf.forEach(item => {
            item.percent = 100 * item.sum / data.sumEtf;
            item.percentTotal = 100 * item.sum / data.total;
            data.percentGoalEtf = Number(data.percentGoalEtf) + Number(item.goal);
            item.percentGoalTotal = Number(item.goal);
            data.percentEtf = Number(data.percentEtf) + Number(item.percentTotal);

            //sum of goal
            item.sumGoal = Number(item.percentGoalTotal * data.total / 100);
            item.difference = Number(item.sumGoal) - Number(item.sum);
        });

        // inner percent for group
        data.share.forEach(item => {
            item.percentGoal = 100 * item.percentGoalTotal / data.percentGoalShare; // curent percent inside group
        });
        data.etf.forEach(item => {
            item.percentGoal = 100 * item.percentGoalTotal / data.percentGoalEtf;
        });
        
        


                    


console.log('\n---------------------------------',data);
        // render
        res.render('rebalance/index', {
            user: user,
            data: data
        });

    })
    .catch(error => {
        console.log(error);
    })
} // show

exports.action = (req, res, next) => {
    // return to /portfolios to choose portfolio
    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }
    const user = req.session.passport.user;
    const portfolioId = req.session.portfolio.id;

    const renderGoals = function() {
        // show goals view
        Portfolio.getPortfolio(portfolioId)
        .then(portfolio => {
            data.portfolio = portfolio;

            return getGoals(portfolioId)
        })
        .then(goals => {
            data.goals = goals;

            return getSecurities();
        })
        .then(securities => {
            data.securities = securities;

            // render view
            res.render('rebalance/goals', {
                user: user,
                data: data
            });

        })
        .catch(err => {
            console.log(err);
        }); // show goals
    } // renderGoals

    var data = {};

    switch (req.body.action) {

        case 'edit':
            Portfolio.getPortfolio(portfolioId)
            .then(portfolio => {
                data.portfolio = portfolio;

                return getGoals(portfolioId)
            })
            .then(goals => {
                data.goals = goals;

                return getSecurities(); // for select production
            })
            .then(securities => { 
                data.securities = securities;

                // render view
                res.render('rebalance/goals', {
                    user: user,
                    data: data
                });

            })
            .catch(error => {
                console.log(error);
            });
            
            break;

        case 'save':


            // clear database
            Goal.destroy({
                truncate: true
            })
            .then(rowDeleted => {
                console.log(`${rowDeleted} rows deleted successfully`);

                // create new records              
                let promises = [];
                
                if (req.body.secid) {
                    for (key in req.body.secid) {
                        let func = Goal.create({
                            portfolioId: parseInt(portfolioId),
                            secid: String(key),
                            amount: req.body.secid[key]
                        });
                        promises.push(func);
                    }
                }             
                return Promise.all(promises);

            })
            .then(result => {
                console.log('Goals added successfully');

                res.redirect('/portfolio/rebalance');
            })
            .catch(err => {
                console.log(err);
                next(err);
            });
            break;

        default:
            res.redirect('/portfolio/rebalance');
    }

} // action