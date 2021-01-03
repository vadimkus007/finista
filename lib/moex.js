const fetch = require('node-fetch');

function checkResponseStatus(res) {
    if(res.ok){
        return res
    } else {
        throw new Error(`The HTTP status of the response: ${res.status} (${res.statusText})`);
    }
}

function parseData(res){
    let result = {};
    for (var section in res) {
        let columns = res[section]['columns'];
        let data = res[section]['data'];

        let newData = {};
        let jsonData = {};
        for (var i = 0; i < data.length; i++) {
            data[i].forEach((value, key) => {
                jsonData[columns[key]] = value;
            });
            
            newData[i] = jsonData;
        };
        result[section] = {};
        //console.log(newData);
    }
    
    return res;
}

function getRequest(url, cb) {
    fetch(url)
        .then(checkResponseStatus)
        .then(res => res.json())
//        .then(res => parseData(res))
        .then(res => cb(null, res))
        .catch(err => console.log(err));
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

    static getHistory(secid, boards, markets, engines, cb) {
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
        let histories = {};
            
        Promise.all(promises).then(responses => {
                
            responses.forEach(item => {
                data.push(item.history.data);
            });
                
            cb(null, data);

        })
        .catch(error => console.log('Error: ', error));
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