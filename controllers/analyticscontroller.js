const models = require('../models');
const Portfolio = models.Portfolio;
const Trade = models.Trade;
const Operation = models.Operation;
const Moex = require('../lib/moex');
const libPortfolio = require('../lib/portfolio');


var exports = module.exports = {}

const getSecuritiesGroups = function(secids) {
    
    let promises = [];

    secids.forEach(secid => {
        promises.push(Moex.getSecurityGroup(secid.secid))
    });
    return Promise.all(promises);
}

const getBoards = function(secids) {
    let promises = [];

    secids.forEach(secid => {
        promises.push(Moex.getPrimaryBoard(secid.secid))
    });
    return Promise.all(promises);
}

const getPrices = function(boards) {

    let options = {
        'iss.only': 'marketdata',
        'marketdata.columns': 'SECID,LAST'
    }

    return new Promise((resolve, reject) => {

        let promises = [];
        boards.forEach(board => {
            let request = {
                engines: board.engine,
                markets: board.market,
                boards: board.boardid,
                securities: board.secid
            }

            promises.push(Moex.getRequest(request, options));
        });

        Promise.all(promises)
        .then(prices => {
            let result = [];
            prices.forEach(price => {
                result.push(price.marketdata[0]);
            });
            resolve(result);
        })
        .catch(error => {
            console.log(error);
            reject(error);
        });

    });
}

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

exports.info = (req, res, next) => {

    // return to /portfolios to choose portfolio
    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }

    var user = 0;
    if (req.isAuthenticated()) {
        user = req.session.passport.user;
    }

    const portfolioId = req.session.portfolio.id;

    var data = {};

    libPortfolio.getPortfolio(portfolioId)

    .then(portfolio => {

        data.portfolio = portfolio;

        return libPortfolio.getSecids(portfolioId)
    
    })
    .then(secids => {
        data.secids = secids;

        return getSectors(data.secids)
    })
    .then(sectors => {
        data.sectors = sectors

        return libPortfolio.getTrades(portfolioId);

    })
    .then(trades => {
        data.trades = trades;

        return libPortfolio.getCashe(portfolioId)

    })
    .then(cashe => {
        data.cashe = cashe;

        return getSecuritiesGroups(data.secids);
    })
    .then(groups => {
        data.groups = groups;

        return getBoards(data.secids);
    })
    .then(boards => {
        data.boards = boards;

        return getPrices(boards);
    })
    .then(prices => {
        data.prices = prices;

        // process new secids as {secidName: {}}
        let obj = {};
        data.secids.forEach(secid => {
            obj[secid.secid] = {};
            obj[secid.secid].secid = secid.secid;
            obj[secid.secid].amount = 0;
            obj[secid.secid].buy = 0;
            obj[secid.secid].sell = 0;
            obj[secid.secid].dividends = 0;
            obj[secid.secid].value = 0;
        });
        data.secids = obj;

        //calculate amount, buy and sell prices of securities
        data.trades.forEach(trade => {
            if (trade.secid !== 'RUB') {

                switch(trade.operationId) {
                    case 1: 
                        data.secids[trade.secid].amount = Number(data.secids[trade.secid].amount) + Number(trade.amount);
                        data.secids[trade.secid].buy = Number(data.secids[trade.secid].buy) + Number(trade.price*trade.amount) + Number(trade.comission);
                        break;
                    case 2: 
                        data.secids[trade.secid].amount = Number(data.secids[trade.secid].amount) - Number(trade.amount);
                        data.secids[trade.secid].sell = Number(data.secids[trade.secid].sell) + Number(trade.price*trade.amount) - Number(trade.comission);
                        break;
                    case 3:
                        data.secids[trade.secid].dividends = Number(data.secids[trade.secid].dividends) + Number(trade.price*trade.amount) - Number(trade.comission);
                        break;
                    case 4:
                        data.secids[trade.secid].amount = Number(data.secids[trade.secid].amount) - Number(trade.amount);
                        data.secids[trade.secid].sell = Number(data.secids[trade.secid].sell) + Number(trade.value*trade.amount*trade.price/100) - Number(trade.comission);
                        break;
                    case 5: 
                        data.secids[trade.secid].dividends = Number(data.secids[trade.secid].dividends) + Number(trade.price*trade.amount) - Number(trade.comission);
                        break;
                    case 6: 
                        data.secids[trade.secid].dividends = Number(data.secids[trade.secid].dividends) + Number(trade.price*trade.amount) - Number(trade.comission);
                        break;
                    case 7:
                        data.secids[trade.secid].amount = Number(data.secids[trade.secid].amount) + Number(trade.amount);
                        data.secids[trade.secid].buy = Number(data.secids[trade.secid].buy) + Number(trade.value*trade.amount*trade.price/100) + Number(trade.accint*trade.amount) + Number(trade.comission);
                        data.secids[trade.secid].value = trade.value;
                        break;
                    case 8:
                        data.secids[trade.secid].amount = Number(data.secids[trade.secid].amount) - Number(trade.amount);
                        data.secids[trade.secid].sell = Number(data.secids[trade.secid].sell) + Number(trade.value*trade.amount*trade.price/100) - Number(trade.accint*trade.amount) - Number(trade.comission);
                        break;
                }
            }
        });

        // add group to secids
        data.groups.forEach(group => {
            data.secids[group.secid].group = group.group;
        });


        // add sector to secids
        data.sectors.forEach(sector => {
            if (typeof sector.payload.symbol !== 'undefined') {
                data.secids[sector.payload.symbol.ticker].sector = sector.payload.symbol.sector;
            }; 
        });

        // calculate prices for each secid
        data.prices.forEach(price => {
            if (data.secids[price.SECID].value !== 0) {
                data.secids[price.SECID].price = Number(data.secids[price.SECID].amount) * Number(price.LAST) * Number(data.secids[price.SECID].value) / 100;
            } else {
                data.secids[price.SECID].price = Number(data.secids[price.SECID].amount) * Number(price.LAST);
            }
            
        });

        // prepare renderdata
        var renderdata = {};
        renderdata.portfolio = data.portfolio;

        // calculate sum of actives
        let sum = Number(data.cashe.cashe);
        let sumShare = 0;
        let sumEtf = 0;
        let sumBonds = 0;
        for (key in data.secids) {
            sum = sum + Number(data.secids[key].price);
            if (data.secids[key].group == 'stock_shares' || data.secids[key].group == 'stock_dr') {
                sumShare = sumShare + Number(data.secids[key].price);
            }
            if (data.secids[key].group == 'stock_etf' || data.secids[key].group == 'stock_ppif') {
                sumEtf = sumEtf + Number(data.secids[key].price);
            }
            if (data.secids[key].group == 'stock_bonds') {
                sumBonds = sumBonds + Number(data.secids[key].price);
            }
        }

        let actives = [];
        let shares = [];
        let etf = [];
        let bonds = [];
        for (key in data.secids) {
            let value = Number(100 * Number(data.secids[key].price) / Number(sum)).toFixed(2);
            let obj = {name: key, y: value};
            actives.push(obj);
            if (data.secids[key].group == 'stock_shares' || data.secids[key].group == 'stock_dr') {
                value = Number(100 * Number(data.secids[key].price) / Number(sumShare)).toFixed(2)
                obj = {name: key, y: value};
                shares.push(obj);
            }
            if (data.secids[key].group == 'stock_etf' || data.secids[key].group == 'stock_ppif') {
                value = Number(100 * Number(data.secids[key].price) / Number(sumEtf)).toFixed(2)
                obj = {name: key, y: value};
                etf.push(obj);
            }
            if (data.secids[key].group == 'stock_bonds') {
                value = Number(100 * Number(data.secids[key].price) / Number(sumBonds)).toFixed(2)
                obj = {name: key, y: value};
                bonds.push(obj);
            }
        }
        let value = Number(100*Number(data.cashe.cashe)/Number(sum)).toFixed(2);
        actives.push({name: 'Рубли', y: value});

        renderdata.actives = actives;

        // actives types
        let activeTypes = [];
        if (sumShare !== 0) {
            value = Number(100*Number(sumShare)/(Number(sum))).toFixed(2);
            activeTypes.push({name: 'Акции', y: value});
        }
        if (sumEtf !== 0) {
            value = Number(100*Number(sumEtf)/(Number(sum))).toFixed(2);
            activeTypes.push({name: 'ETF/ПИФ', y: value});
        }
        if (sumBonds !== 0) {
            value = Number(100*Number(sumBonds)/(Number(sum))).toFixed(2);
            activeTypes.push({name: 'Облигации', y: value});
        }
        value = Number(100*Number(data.cashe.cashe)/(Number(sum))).toFixed(2);
        activeTypes.push({name: 'Рубли', y: value});

        renderdata.activeTypes = activeTypes;
        renderdata.shares = shares;
        renderdata.etf = etf;
        renderdata.bonds = bonds;

// process sectors
        var sectors = [];
        for (key in data.secids) {
            if (typeof data.secids[key].sector !== 'undefined') {
                sectors[data.secids[key].sector] = [];
            }
        }
        for (key in data.secids) {
            if (typeof data.secids[key].sector !== 'undefined') {
                sectors[data.secids[key].sector].push(key);
            }
        }

        var sec = [];
        for (key in sectors) {
            let sum = 0;
            let name = '';
            sectors[key].forEach(secid => {
                sum = sum + Number(data.secids[secid].price);
                name = name + ',' + secid;
            });
            name = name.slice(1, name.length-1);
            let obj = {name: key, y: sum, label: name};
            sec.push(obj);
        }
        sectors = sec;

        var sumSector = 0;
        sectors.forEach(sector => {
            sumSector = sumSector + sector.y;
        });
        sectors.forEach(sector => {
            sector.y = Number(100*Number(sector.y)/Number(sumSector)).toFixed(2);
        });

        renderdata.sectors = sectors;

        // Efficiency securities 
        var efficiency = [];
        for (key in data.secids) {
            efficiency.push([key, data.secids[key].price + data.secids[key].sell + data.secids[key].dividends - data.secids[key].buy]);
        }
        // sort array
        efficiency.sort((a, b) => {
            return b[1] - a[1];
        });
        let out = {categories: [], data: []};
        efficiency.forEach(item => {
            out.categories.push(item[0]);
            out.data.push(item[1]);
        });

        renderdata.efficiency = out;        

//console.log('DATA', data);
//console.log(sectors);
        // render view
        res.render('analytics', {
            user: user,
            data: renderdata
        });

    })
    .catch(error => console.log(error));

}
