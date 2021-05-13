const models = require('./models');
const Moex = models.Moex;
const fetch = require('node-fetch');
const moment = require('moment');

/*
Moex.create({
    request: 'request1',
    responce: {field: 'field1', field2: 1000},
    permanent: 0
})
.then(result => {
    console.log('record created: ', result);
})
.catch(err => console.log(err));
*/

const UPDATE_DELAY = 15 // minutes;

const url = 'http://iss.moex.com/iss/securities/GAZP.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine,is_primary';

function getBuffer(url) {
        return Moex.findOne({
            where: {
                request: url
            }
        });
}

function fetchJSON(url) {
    return fetch(url).then(response => response.json());
}

function updateRecord(record) {
    return new Promise((resolve, reject) => {
        getBuffer(record.request)
        .then(result => {
            if (result) {
                result.responce = record.responce;
                return result.save();
            } else {
                return Moex.create(record);
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

function fetchBuffer(url) {
        return new Promise((resolve, reject) => {
            getBuffer(url)
            .then(record => {
                if (record) {
                    if (record.permanent) {
                        console.log('PERMANENT');
                        return record.get('responce');
                    } else {
                        let updated = moment(record.get('updatedAt'));
                        let now = moment();
                        let duration = moment.duration(now.diff(updated)).asMinutes();
                        if (duration > UPDATE_DELAY) {
                            return fetchJSON(url)
                                .then(response => updateRecord({request: url, responce: response}));
                        } else {
                            return record.get('responce');
                        }
                    }
                } else {
                    console.log('not found');
                    return fetchJSON(url)
                        .then(response => updateRecord({request: url, responce: response}));
                }
            })
            .then(result => {
                resolve(result);
            })
            .catch(err => reject(err));
        });
    }

const rec = {
    request: url,
    responce: {array: [], string: 'string', number: 1000}
}

fetchBuffer(url)
.then(result => {
    console.log(result);
    return;
})
.catch(err => {
    console.log(err);
    return;
});