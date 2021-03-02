const models = require('../../models');
const Trade = models.Trade;

const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');
const moment = require('moment');

const Sber = require('../../lib/sber');

var exports = module.exports = {}

const moveFile = function(file, somePlace) {
    return new Promise((resolve, reject) => {
        file.mv(somePlace, function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

const createRecord = function(trade) {
    return new Promise((resolve, reject) => {
        Trade.create(trade)
        .then(result => {
            resolve(result);
        })
        .catch(err => {
            console.log(err);
            reject(err);
        })
    });
} // createRecord

const createRecords = function(trades) {

    let promises = [];
    trades.forEach(trade => {
        promises.push(createRecord(trade));
    });
    return Promise.all(promises);
}

exports.import = (req, res, next) => {
    
    const portfolioId = req.params.id;

    const broker = req.body.broker;

    if (!portfolioId) {
            return res.status(404).json({
                error: 'Portfolio is not selected'
            });
            // return next();
    };

    var tradesFilePath = '';
    var casheFilePath = '';

    if (!req.files || Object.keys(req.files).length === 0) {
        console.log('No files are uploaded');
        return res.json({
            message: 'No files are uploaded'
        })
    }

    let promises = [];

    // process uploaded files
    if (typeof req.files.trades !== 'undefined') {
        
        let extName = path.extname(req.files.trades.name);
        tradesFilePath = path.resolve(__dirname, '../../uploads', 'trades' + extName);

        promises.push(moveFile(req.files.trades, tradesFilePath));
    }

    if (typeof req.files.cashe !== 'undefined') {
        
        let extName = path.extname(req.files.cashe.name);
        casheFilePath = path.resolve(__dirname, '../../uploads', 'cashe' + extName);

        promises.push(moveFile(req.files.cashe, casheFilePath));
    }

    Promise.all(promises)
    .then(() => {
        console.log('Files uploaded successfully.');

        var tradesBuffer = [];
        var casheBuffer = [];

        if (tradesFilePath) {
            tradesBuffer = xlsx.parse(tradesFilePath);
        }
        if (casheFilePath) {
            casheBuffer = xlsx.parse(casheFilePath);
        }

        const buffer = [...tradesBuffer,...casheBuffer];

        var trades = Sber.parse(buffer);

        return createRecords(trades);
    })
    .then(() => {

        console.log('New data inserted into database');

        return res.json({
            message: 'Trades imported successfully'
        });
    
    })
    .catch(err => {
        console.log(err);
        return res.json({
            error: err.message
        });
    });
    
}