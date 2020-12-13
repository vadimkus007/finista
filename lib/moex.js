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

// Class for getting quotes from MOEX API
class Moex {

    constructor(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }

    static getBoardsInfo(secid, cb) {
        let url = `http://iss.moex.com/iss/securities/${secid}.json?iss.meta=off&iss.only=boards`;
        getRequest(url, (err, res) => {
            cb(null, res);
        });
    }

    static getSecurityInfo(request,  cb) {

        let url = `http://iss.moex.com/iss/engines/${request['engines']}/markets/${request['markets']}/boards/${request['boards']}/securities/${request['secid']}.json?iss.meta=off`;

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

}

module.exports = Moex;