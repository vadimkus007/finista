const models = require('../../models');
const Goal = models.Goal;
const Portfolio = models.Portfolio;
const Trade = models.Trade;

const Moex = require('../../lib/moex');
const LibPortfolio = require('../../lib/portfolio');

var exports = module.exports = {};

// get Sectors for shares only from Tinkoff API
// shares = array from preparing renderview [{name: secid, y: value}]
const getSectors = function(secids) {
    var url = 'https://api-invest.tinkoff.ru/trading/stocks/get?ticker=';

    let urls = [];
    
    secids.forEach(item => {
        urls.push(url + item.secid);
    });
    let promises = urls.map(index => Moex.fetchJSON(index));

    return Promise.all(promises)
}

const getSecid = (array, secid) => {
    let result = array.find((element) => {
        return (element.secid === secid) ? true : false;
    });
    return result;
}

exports.info = (req, res, next) => {

        var data = {};

        const portfolioId = req.params.id;
        if (!portfolioId) {
            return res.status(400).json({
                error: 'Portfolio is not selected'
            });
        };

        LibPortfolio.getPortfolio(portfolioId)

        .then(portfolio => {
            data.portfolio = portfolio;

            return LibPortfolio.getSecids(data.portfolio.id);
        })
        .then(secids => {
            data.secids = secids;

            return LibPortfolio.getSecidsAmount(data.portfolio.id, data.secids);
        })
        .then(amount => {
            for (var i = 0; i<data.secids.length; i++) {
                data.secids[i] = {...data.secids[i], ...amount[i]};
            }

            let promises = [];
            data.secids.forEach(secid => {
                promises.push(Moex.getPrice(secid.secid));
            });

            return Promise.all(promises);
        })
        .then(prices => {
            for (var i = 0; i< data.secids.length; i++) {
                data.secids[i] = {...data.secids[i], ...prices[i]};
            }

            return LibPortfolio.getCashe(data.portfolio.id);
        })
        .then(cashe => {
            data.cashe = cashe.cashe;

            return getSectors(data.secids);
        })
        .then(sectors => {
            data.sectors = sectors;

            let promises = [];
            data.secids.forEach(item => {
                let price = getSecid(data.secids, item.secid).price;
                promises.push(LibPortfolio.getSecidProfit(data.portfolio.id, item.secid, price));
            });

            return Promise.all(promises);
        })
        .then(profits => {
            data.profits = profits;

            // process data

            var total = Number(data.cashe);
            var totalShares = 0;
            var totalEtf = 0;
            var totalBonds = 0;

            data.secids.forEach(secid => {
                // set new group
                switch (secid.group) {
                    case 'Акция':
                        secid.group = 'Акции';
                        break;
                    case 'Депозитарная расписка':
                        secid.group = 'Акции';
                        break;
                    case 'ETF':
                        secid.group = 'ETF/ПИФ';
                        break;
                    case 'ПИФ':
                        secid.group = 'ETF/ПИФ';
                        break;
                    case 'Облигация':
                        secid.group = 'Облигации';
                        break;
                    default:
                        break;
                }
                /*
                if (secid.group === 'Акция' || secid.group === 'Депозитарная расписка') {
                    secid.group = 'Акции';
                }
                if (secid.group === 'ПИФ' || secid.group === 'ETF') {
                    secid.group = 'ETF/ПИФ';
                }
                if (secids.group === 'Облигация') {
                    secid.group = 'Облигации';
                }
*/
                // calc cost
                if (!secid.cost) {secid.cost = 0};
                secid.cost = secid.cost + secid.price * secid.amount;
                total += Number(secid.cost);
                if (secid.group === 'Акции') {totalShares += Number(secid.cost)};
                if (secid.group === 'ETF/ПИФ') {totalEtf += Number(secid.cost)};
                if (secid.group === 'Облигации') {totalBonds += Number(secid.cost)};
            });

            let actives = [];
            let shares = [];
            let etf = [];

            data.secids.forEach(row => {
                let obj = {
                    name: row.secid,
                    y: 100 * row.cost / total
                };
                actives.push(obj);

                if (row.group === 'Акции') {
                    obj = {
                        name: row.secid,
                        y: 100 * row.cost / totalShares
                    };
                    if (totalShares > 0) { shares.push(obj) };
                }
                if (row.group === 'ETF/ПИФ') {
                    obj = {
                        name: row.secid,
                        y: 100 * row.cost / totalEtf
                    };
                    if (totalEtf > 0) { etf.push(obj) };
                }


            });
            actives.push({name: 'Рубли', y: 100 * data.cashe / total});

            let activeTypes = [
                {
                    name: 'Рубли',
                    y: 100 * data.cashe / total
                }
            ];
            if (totalShares > 0) { activeTypes.push({name: 'Акции', y: totalShares}); };
            if (totalEtf > 0) { activeTypes.push({name: 'ETF/ПИФ', y: totalEtf}); };
            if (totalBonds > 0) { activeTypes.push({name: 'Облигации', y: totalBonds}); };

            // process sectors
            // add sector to secids
           
            data.sectors.forEach(row => {
                if (typeof row.payload.symbol !== 'undefined') {
                    let ticker = row.payload.symbol.ticker;
                    let sector = row.payload.symbol.sector;
                    data.secids.forEach(secid => {
                        if (secid.secid === ticker) {
                            secid.sector = sector;
                        }
                    });
                }; 

            });

            var sectors = [];
            data.secids.forEach(secid => {
                if (typeof secid.sector !== 'undefined') {
                    sectors[secid.sector] = [];
                }
            });
            data.secids.forEach(secid => {
                if (typeof secid.sector !== 'undefined') {
                    sectors[secid.sector].push(secid.secid);
                }
            });

            var sec = [];
            for (var key in sectors) {
                let sum = 0;
                let name = '';
                sectors[key].forEach(secid => {
                    let obj = getSecid(data.secids, secid);
                    if (obj) {
                        sum += Number(obj.cost);
                        name += ','+secid;
                    }
                });
                name = name.slice(1, name.length-1);
                let obj = {
                    name: key,
                    y: sum,
                    label: '('+name+')'
                }
                sec.push(obj);
            }
            sectors = sec;
            
            var sumSector = 0;
            sectors.forEach(sector => {
                sumSector += Number(sector.y);
            });
            sectors.forEach(sector => {
                sector.y = Number(100*Number(sector.y)/Number(sumSector));
            });

            // efficiency
            let efficiency = [];
            data.profits.forEach(row => {
                efficiency.push([row.secid, row.profit]);
            });
            // sort efficiency
            efficiency.sort((a, b) => {
                return b[1] - a[1];
            });
            let out = {categories: [], data: []};
            efficiency.forEach(item => {
                out.categories.push(item[0]);
                out.data.push(item[1]);
            });

// console.log(data);

            res.json({
                actives,
                activeTypes,
                shares,
                etf,
                sectors,
                efficiency
            });

        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
            // return next(err);
        });
}