const fetch = require('node-fetch');

function checkResponseStatus(res) {
    if(res.ok){
        return res
    } else {
        throw new Error(`The HTTP status of the reponse: ${res.status} (${res.statusText})`);
    }
}

// Constants for url formation
const prefix = 'http://iss.moex.com';
const postfix = '.xml';
const iss = '/iss';
const issHistory = '/iss/history';
const engines = '/engines';         // engines e.g. stocks etc
const markets = '/markets';        // markets
const boards = '/boards';
const securities = '/securities';


// Class for getting quotes from MOEX API
class Moex {

    constructor(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }

    static getSequrities(request, cb) {
        let url = `http://iss.moex.com/iss/engines/${request.engine || 'stock'}/markets/${request.market || 'shares'}/boards/${request.board || 'TQBR'}/securities.json?iss.meta=off`;
        fetch(url)
            .then(checkResponseStatus)
            .then(response => response.json())
            .then(data => cb(null, data))
            .catch(err => console.log(err));
    }

    static getQuotes(cb) {
        let url = 'http://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off';
        fetch(url)
            .then(checkResponseStatus)
            .then(response => response.json())
            .then(data => cb(null, data))
            .catch(err => console.log(err));
    }
}

module.exports = Moex;