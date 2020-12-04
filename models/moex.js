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

    static getBoards(cb) {
        let items = [];
        
        cb(null, items);
    };

    static getQuotes(cb) {
        let url = 'http://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off';
        fetch(url)
            .then(checkResponseStatus)
            .then(response => response.json())
//            .then(data => console.log(data))
            .then(data => cb(null, data))
            .catch(err => console.log(err));
    }
}

module.exports = Moex;