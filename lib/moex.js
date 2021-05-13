const fetch = require('node-fetch');
// const fetch = require('./fetchWithTimeout');
const moment = require('moment');
const models = require('../models');
const MoexBuffer = models.Moex;

const UPDATE_DELAY = 15; // minutes

function checkResponseStatus(res) {
    if(res.ok){
        return res
    } else {
        throw new Error(`The HTTP status of the response: ${res.status} (${res.statusText})`);
    }
}


function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

/***********************************************************
    fetch with buffer functions
*/
function getBuffer(url) {
    return MoexBuffer.findOne({
        where: {
            request: url
        }
    });
};

function updateRecord(record) {
    return new Promise((resolve, reject) => {
        getBuffer(record.request)
        .then(result => {
            if (result) {
                result.responce = record.responce;
                return result.save();
            } else {
                return MoexBuffer.create(record);
            }
        })
        .then(res => {
            resolve(res.get('responce'));
        })
        .catch(err => {
            reject(err);
        });
    });
};

/* ********************************************************/

// Class for getting quotes from MOEX API
class Moex {

    constructor(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }

    

    static fetchJSON(url) {
        return fetch(url).then(response => response.json());
    }

    static fetchBuffer(url) {
        return new Promise((resolve, reject) => {
            getBuffer(url)
            .then(record => {
                if (record) {
                    if (record.permanent) {
                        console.log('BUFFER: ', url);
                        return record.get('responce');
                    } else {
                        let updated = moment(record.get('updatedAt'));
                        let now = moment();
                        let duration = moment.duration(now.diff(updated)).asMinutes();
                        if (duration > UPDATE_DELAY) {
                            console.log('MOEX: ', url);
                            return this.fetchJSON(url)
                                .then(response => updateRecord({request: url, responce: response}));
                        } else {
                            console.log('BUFFER: ', url);
                            return record.get('responce');
                        }
                    }
                } else {
                    console.log('MOEX: ', url);
                    return this.fetchJSON(url)
                        .then(response => updateRecord({request: url, responce: response}));
                }
            })
            .then(result => {
                resolve(result);
            })
            .catch(err => reject(err));
        });
    }

    
    static parseData(res){
        return new Promise((resolve, reject) => {
            var result = {};
            for (var section in res) {
                let columns = res[section]['columns'];
                let data = res[section]['data'];

                let newData = [];
                
                data.forEach(items => {
                    let jsonData = {};
                    for (var i = 0; i<items.length; i++) {
                        jsonData[columns[i]] = items[i];
                    }
                    newData.push(jsonData);
                });
                result[section] = newData;
            }
            resolve(result);
        })
    }



    static getRequest(request, options) {
    
        var url = 'http://iss.moex.com/iss';
        for (var key in request) {
            if (request[key] === null || request[key] === '') {
                url = url + `/${key}`; 
            } else {
                url = url + `/${key}/${request[key]}`;
            }
        }
        url = url + '.json?iss.meta=off';
        if (options) {
            for (var key in options) {
                url = url + `&${key}=${options[key]}`;
            }
        }
        
        // console.log('MOEX:', url);
        // return fetch(url).then(result => result.json()).then(response => this.parseData(response));
        return this.fetchBuffer(url).then(response => this.parseData(response));

    } // get Request

    // getHistoryRequest
    static getHistoryRequest(request, options) {
        var url = 'http://iss.moex.com/iss/history';
        for (var key in request) {
            if (request[key] === null || request[key] === '') {
                url = url + `/${key}`; 
            } else {
                url = url + `/${key}/${request[key]}`;
            }
        }
        url = url + '.json?iss.meta=off';
        if (options) {
            for (var key in options) {
                url = url + `&${key}=${options[key]}`;
            }
        }
        
        console.log('MOEX:', url);
        // return fetch(url).then(result => result.json()).then(response => this.parseData(response));
        return this.fetchBuffer(url).then(response => this.parseData(response));

    } // getHistoryRequest

    static getSecurityGroup(secid) {
        let request = {securities: ''};
        let options = {
            'securities.columns': 'secid,group',
            q: secid
        }

        return new Promise((resolve, reject) => {
            this.getRequest(request, options)
            .then(request => {
                var result = {};
                request.securities.forEach(security => {
                    if (security.secid === secid) {
                        result = security;
                    }
                })
                resolve(result);
            })
            .catch(error => {
                console.log(error);
                reject(error);
           })
        });
    }

    static getPrimaryBoard(secid) {
        let request = {
            securities: secid
        }
        let options = {
            'iss.only': 'boards',
            'boards.columns': 'secid,boardid,market,engine,is_primary'
        }

        return new Promise((resolve, reject) => {
            this.getRequest(request, options)
            .then(request => {
                var result = {};
                request.boards.forEach(board => {
                    if (board.is_primary == 1) {
                        result.secid = board.secid;
                        result.boardid = board.boardid;
                        result.market = board.market;
                        result.engine = board.engine
                    }
                });
                resolve(result);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            })
        });
    }

    /*
        function getPrice(secid, date)
        returns {secid: NAME, price: PRICE}
        if date is null returns last prise from security marketdata
        id date is selected, returns last prise from history request for the last week
    */
    static getPrice(secid, date) {
        
        if (typeof date === 'undefined') {

            return new Promise((resolve, reject) => {
                this.getPrimaryBoard(secid)
                .then(board => {
                    let request = {
                        engines: board.engine,
                        markets: board.market,
                        boards: board.boardid,
                        securities: board.secid
                    };
                    let options = {
                        'iss.only': 'marketdata',
                        'marketdata.columns': 'SECID,LAST'
                    };

                    return Moex.getRequest(request, options);
                })
                .then(data => {
                    let result = {};
                    result.secid = data.marketdata[0].SECID;
                    result.price = data.marketdata[0].LAST;

                    resolve(result);

                })
                .catch(error => {
                    console.log(error);
                    reject(error);
                });

            });     

        } else {

            return new Promise((resolve,reject) => {
                this.getPrimaryBoard(secid)
                .then(board => {
                    let request = {
                        engines: board.engine,
                        markets: board.market,
                        boards: board.boardid,
                        securities: board.secid
                    };
                    let options = {
                        'history.columns': 'SECID,TRADEDATE,CLOSE',
                        'from': moment(date).subtract(1, 'week').format('YYYY-MM-DD'),
                        'till': moment(date).format('YYYY-MM-DD')
                    };

                    return Moex.getHistoryRequest(request, options);
                })
                .then(data => {

                    let last = data.history.length-1;
                    let result = {};
                    result.secid = data.history[last].SECID;
                    result.price = data.history[last].CLOSE;

                    resolve(result);

                })
                .catch(error => {
                    console.log(error);
                    reject(error);
                });
            });

        }
    } // getPrice

    static getHistory(secid, startDate, endDate) {

        let _startDate = moment(startDate);
        let _endDate = moment(endDate);
        var duration = moment.duration(_endDate.diff(_startDate));
        var days = Math.round(duration.asDays());

        const workingDays = 250;
        const pageSize = 100;

        return new Promise((resolve, reject) => {
            this.getPrimaryBoard(secid)
            .then(board => {
                let request = {
                    engines: board.engine,
                    markets: board.market,
                    boards: board.boardid,
                    securities: board.secid
                };
                let options = {
                    'history.columns': 'SECID,TRADEDATE,CLOSE',
                    'from': startDate,
                    'till': endDate
                };

                let pages = Math.ceil(days / pageSize);

                let promises = [];
                for (var start = 0; start < days; start += pageSize) {
                    options = {...options, ['start']: String(start)};
                    promises.push(Moex.getHistoryRequest(request, options));
                }

                return Promise.all(promises);
            })
            .then(histories => {
                let results = [];
                histories.forEach(history => {
                    // results = results.concat(history.history);
                    results = [...results, ...history.history];
                });

                resolve(results);
            })  
            .catch(err => {
                console.log(err);
                reject(err);
            });
        });
    } // getHistory

    static getLastPrice(board) {
            let request = {
                engines: board.engine,
                markets: board.market,
                boards: board.boardid,
                securities: board.secid
            };
            let options = {
                'iss.only': 'securities,marketdata',
                'securities.columns': 'SECID,SHORTNAME,CURRENCYID',
                'marketdata.columns': 'LAST,LASTTOPREVPRICE,UPDATETIME'
            }
            return this.getRequest(request, options);
    }

// ***********************************************************************************************    

    static getBoards(secid, cb) {
        let url = `http://iss.moex.com/iss/securities/${secid}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine`;
        getRequest(url, (err,res) => {
            let result = [];
            for (var key in res.boards.columns) {
                result[res.boards.columns[key]] = res.boards.data[0][key];
            }

             cb(null, result);

        });
    }

    static getBoardsInfo(secid, cb) {
        let url = `http://iss.moex.com/iss/securities/${secid}.json?iss.meta=off&iss.only=boards`;
        getRequest(url, (err, res) => {
            cb(null, res);
        });
    }

    static getSecurityInfo(request,  cb) {

        let url = `http://iss.moex.com/iss/engines/${request['engines']}/markets/${request['markets']}/boards/${request['boards']}/securities/${request['secid']}.json`;
        if (request.params) { url = url + '?' + request.params; }

        getRequest(url, (err, res) => {
            cb(null, res);
        });
    }

    static getSequrities(request, cb) {
        let url = `http://iss.moex.com/iss/engines/${request.engine || 'stock'}/markets/${request.market || 'shares'}/boards/${request.board || 'TQBR'}/securities.json`;
        if (request.params) {
            url = url + '?' + request.params;
        }

        getRequest(url, (err, res) => {
            cb(null, res);
        });
    }

    static getCustom(request, cb) {
        getRequest(request, (err, res) => {
            cb(null, res);
        });
    }

    static getCandles(request, cb) {
        let url = `http://iss.moex.com/iss/history/engines/${request.engine || 'stock'}/markets/${request.market || 'shares'}/boards/${request.board || 'TQBR'}/securities/${request.security || 'AFLT'}/candles.json`;
        if (request.params) { url = url + '?' + request.params; }

        getRequest(url, (err, res) => {
            cb(null, res);
        });
    }

    static _getHistory(secid, boards, markets, engines, cb) {
        let baseURL = `http://iss.moex.com/iss/history/engines/${engines}/markets/${markets}/boards/${boards}/securities/${secid}.json?iss.meta=off&history.columns=TRADEDATE,CLOSE`;

        // get dates from 3 year before to today
        var today = new Date();
        var start = new Date();
        start= start.setMonth(start.getMonth() - 36); // -3 years from

        baseURL = baseURL + '&from=' + formatDate(start) + '&till=' + formatDate(today);
        
        let total = 1080;
        let pagesize = 100;

        let urls = [];
        for (var i = 0; i < total; i = i+pagesize) {
            urls.push(baseURL + '&start=' + String(i));
        }

        let promises = urls.map(url => this.fetchJSON(url));

        var data = [];
        

        return new Promise((resolve, reject)  => {

            Promise.all(promises).then(responses => {
                
                responses.forEach(item => {
                    data.push(item.history.data);
                });

                resolve(data);

            })
            .catch(error => reject(error));

        });
    

/*
        Promise.all(promises).then(responses => {
                
            responses.forEach(item => {
                data.push(item.history.data);
            });

            cb(null, data);

        })
        .catch(error => console.log('Error: ', error));
*/
    }

    static getPriceDate(secid, boards, markets, engines, date, cb) {
        let url = `http://iss.moex.com/iss/history/engines/${engines}/markets/${markets}/boards/${boards}/securities/${secid}.json?iss.meta=off&history.columns=TRADEDATE,CLOSE&from=${date}&till=${date}`;
        getRequest(url, (err, res) => {
            cb(null, res);
        });
    }

    static getHistoryFromDate(secid, boards, markets, engines, from) {
        
        return new Promise(function(resolve, reject) {

            let baseURL = `http://iss.moex.com/iss/history/engines/${engines}/markets/${markets}/securities/${secid}.json?iss.meta=off&from=${from}`;

            let urls = [];
            urls.push(baseURL);
            let promises = urls.map(url => Moex.fetchJSON(url));
            
            Promise.all(promises)
            .then(results => {
                let total = results[0]['history.cursor'].data[0][1];
                let pagesize = results[0]['history.cursor'].data[0][2];

                let urls = [];
                for (let start=0; start<total; start=start+pagesize) {
                    urls.push(baseURL + '&history.columns=BOARDID,TRADEDATE,CLOSE&start=' + String(start));
                }
                let promises = urls.map(url => Moex.fetchJSON(url));

                Promise.all(promises)
                .then(rows => {
                    
                        let result = [];
                        rows.forEach(row => {
                            let parsedData = row.history.data.filter(item => item[0].toUpperCase() == boards.toUpperCase());
                            parsedData.forEach(item => {
                                item.splice(0, 1);
                                result.push(item);
                            });
                        });

                        resolve(result); // return result
                        reject('Error loading data');


                    
                })
                .catch((err) => console.log(err));
            })
            .catch(err => console.log(err));

        }); // return promise

    } // getHistoryFromDate

}

module.exports = Moex;