const fetch = require('node-fetch');

function checkResponseStatus(res) {
    if(res.ok){
        return res
    } else {
        throw new Error(`The HTTP status of the reponse: ${res.status} (${res.statusText})`);
    }
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
        fetch(url)
            .then(checkResponseStatus)
            .then(res => res.json())
            .then(res => cb(null, res))
            .catch(err => console.log(err));
    }

    static getSecurityInfo(request, cb) {

        let url = `http://iss.moex.com/iss/engines/${request['engines']}/markets/${request['markets']}/boards/${request['boards']}/securities/${request['secid']}.json?iss.meta=off`;

        fetch(url)
            .then(checkResponseStatus)
            .then(response => response.json())
            .then(data => cb(null, data))
            .catch(err => console.log(err));
    }

    static getSequrities(request, cb) {
        let url = `http://iss.moex.com/iss/engines/${request.engine || 'stock'}/markets/${request.market || 'shares'}/boards/${request.board || 'TQBR'}/securities.json?iss.meta=off`;
        fetch(url)
            .then(checkResponseStatus)
            .then(response => response.json())
            .then(data => cb(null, data))
            .catch(err => console.log(err));
    }

}

module.exports = Moex;