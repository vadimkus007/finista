const passport = require('passport');
const models = require('../../models');
const Goal = models.Goal;
const Portfolio = models.Portfolio;
const Trade = models.Trade;

const Moex = require('../../lib/moex');
const LibPortfolio = require('../../lib/portfolio');

var exports = module.exports = {}


const SHARES = ['1', '2', 'D'];
const ETF = ['9', 'A', 'B', 'E', 'J'];
const BONDS = ['3', '4', '5', '6', '7', '8', 'C'];

exports.show = (req, res, next) => {

    passport.authenticate('jwt', {session: false}, (err, user, done) => {

        if (err || !user) {
            return res.status(401).json({
                message: 'Unauthorized',
                error: err
            });
        }

        const portfolioId = req.params.id;
        if (!portfolioId) {
            return res.status(400).json({
                error: 'Portfolio is not selected'
            });
        };

        var data = {};
        var securities = {};

        LibPortfolio.getPortfolio(portfolioId)
        .then(portfolio => {

            data.portfolio = portfolio;

            // get cashe
            return LibPortfolio.getCashe(data.portfolio.id);
        })
        .then(cashe => {
            data.portfolio.cashe = cashe.cashe;

            return LibPortfolio.getSecids(data.portfolio.id);
        })
        .then(secids => {
            return LibPortfolio.getSecidsAmount(data.portfolio.id, secids);
        })
        .then(amounts => {
            data.secids = amounts;

            // get goals
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

            // join goals and securities

            data.secids.forEach(row => {
                securities[row.secid] = row;
            });
            data.goals.forEach(goal => {
                if (!securities[goal.secid]) {
                    securities[goal.secid] = {
                        secid: goal.secid,
                        amount: 0,
                        goal: goal.amount
                    }
                } else {
                    securities[goal.secid].goal = goal.amount;
                }
            });

            // get Moex data
            let promises = [];
            for (var key in securities) {
                promises.push(Moex.getPrimaryBoard(securities[key].secid));
            };
            return Promise.all(promises);
        })
        .then(boards => {

            let promises = [];

            let options = {
                'iss.only': 'securities,marketdata',
                'securities.columns': 'SECID,LOTSIZE,SECTYPE',
                'marketdata.columns': 'LAST'
            }
            boards.forEach(board => {
                let request = {
                    engines: board.engine,
                    markets: board.market,
                    boards: board.boardid,
                    securities: board.secid
                }
                promises.push(Moex.getRequest(request, options));
            });

            return Promise.all(promises);
        })
        .then(results => {

            data.marketdata = [];
            results.forEach(row => {
                let obj = {...row.securities[0], ...row.marketdata[0]};
                data.marketdata.push(obj);
            });
            
            data.marketdata.forEach(row => {
                let group = '';
                if (SHARES.includes(row.SECTYPE)) { group = 'shares' };
                if (ETF.includes(row.SECTYPE)) { group = 'etf' };
                if (BONDS.includes(row.SECTYPE)) { group = 'bonds' };
                securities[row.SECID].group = group;
                securities[row.SECID].lotsize = row.LOTSIZE;
                securities[row.SECID].price = row.LAST;
            });

            // calculate data for output
            
            var total = 0;
            var sharesCost = 0;
            var etfCost = 0;
            var bondsCost = 0;

            var sharesGoalPrc = 0;
            var etfGoalPrc = 0;
            var bondsGoalPrc = 0;

            data.shares = [];
            data.etf = [];
            data.bonds = [];

            for (var key in securities) {
                let row = securities[key];
                
                row.cost = row.price * row.amount;
                total += Number(row.cost);
                if (row.group === 'shares') { 
                    sharesCost += Number(row.cost);
                    sharesGoalPrc += Number(row.goal);
                    data.shares.push(row);
                };
                if (row.group === 'etf') { 
                    etfCost += Number(row.cost);
                    etfGoalPrc += Number(row.goal);
                    data.etf.push(row);
                };
                if (row.group === 'bonds') { 
                    bondsCost += Number(row.cost);
                    bondsGoalPrc += Number(row.goal);
                    data.bonds.push(row);
                };
                
            }

            data.portfolio.cost = total;
            data.portfolio.shares = sharesCost;
            data.portfolio.etf = etfCost;
            data.portfolio.bonds = bondsCost;

            data.total = {
                shares: {
                    current: data.portfolio.shares,
                    currentPrc: 100 * data.portfolio.shares / data.portfolio.cost,
                    goal: sharesGoalPrc * data.portfolio.cost / 100,
                    goalPrc: sharesGoalPrc
                },
                etf: {
                    current: data.portfolio.etf,
                    currentPrc: 100 * data.portfolio.etf / data.portfolio.cost,
                    goal: etfGoalPrc * data.portfolio.cost / 100,
                    goalPrc: etfGoalPrc
                },
                bonds: {
                    current: data.portfolio.bonds,
                    currentPrc: 100 * data.portfolio.bonds / data.portfolio.cost,
                    goal: bondsGoalPrc * data.portfolio.cost / 100,
                    goalPrc: bondsGoalPrc
                },
                cashe: {
                    current: data.portfolio.cashe,
                    currentPrc: data.portfolio.cashe / data.portfolio.cost,
                    goal: 0,
                    goalPrc: 0
                }
            };

console.log(data);
console.log(securities);

            res.json({
                message: 'It is still OK',
                total: data.total,
                shares: data.shares,
                etf: data.etf,
                bonds: data.bonds
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
            return next(err);
        })


    })(req, res, next);
}