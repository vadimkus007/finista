const models = require('../models');
const Trade = models.Trade;

const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');
const moment = require('moment');

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

    if (req.session.portfolio == null) {
        req.flash('message', 'Portfolio is not defined');
        
        res.redirect('/portfolios');
        return next();
    }

    const portfolioId = req.session.portfolio.id;

    var tradesFilePath = '';
    var casheFilePath = '';

    if (!req.files || Object.keys(req.files).length === 0) {
        console.log('No files are uploaded');
        res.locals.message = 'No files were uploaded';
        res.redirect('/portfolio/trades/import');
        return next();
    }

    let promises = [];

    // process uploaded files
    if (typeof req.files.tradesFile !== 'undefined') {
        
        let extName = path.extname(req.files.tradesFile.name);
        tradesFilePath = path.resolve(__dirname, '../uploads', 'trades' + extName);

        promises.push(moveFile(req.files.tradesFile, tradesFilePath));
    }

    if (typeof req.files.casheFile !== 'undefined') {
        
        let extName = path.extname(req.files.casheFile.name);
        casheFilePath = path.resolve(__dirname, '../uploads', 'cashe' + extName);

        promises.push(moveFile(req.files.casheFile, casheFilePath));
    }

    Promise.all(promises)
    .then(() => {
        console.log('Files uploaded successfully.');
        var tradesBuffer = [];
        var casheBuffer = [];
        var trades = [];

        if (tradesFilePath) {
            tradesBuffer = xlsx.parse(tradesFilePath);
        }
        if (casheFilePath) {
            casheBuffer = xlsx.parse(casheFilePath);
        }

        // trades processing
        tradesBuffer.forEach(rows => {
            if (rows.name == 'Сделки') {
                for (var i = 1; i<rows.data.length; i++) {
                    let row = rows.data[i];
                    let obj = {
                        portfolioId: portfolioId,
                        secid: row[4],
                        date: moment(new Date((row[2] - 25569)*86400*1000)).format('YYYY-MM-DD'),
                        amount: row[8],
                        price: row[9] * row[13],
                        accint: row[10]*row[13],
                        comission: (Number(row[14]) + Number(row[15])).toFixed(2)
                    };
                    switch (row[5]) {
                        case 'Акция':
                            obj.group='Акция';
                            if (row[7] == 'Покупка') {
                                obj.operationId = 1;
                            }
                            if (row[7] == 'Продажа') {
                                obj.operationId = 2;
                            }
                            break;
                        case 'Пай':
                            obj.group = 'ETF';
                            if (row[7] == 'Покупка') {
                                obj.operationId = 1;
                            }
                            if (row[7] == 'Продажа') {
                                obj.operationId = 2;
                            }
                            break;
                        case 'Депозитарная расписка':
                        obj.group = 'Депозитарная расписка';
                            if (row[7] == 'Покупка') {
                                obj.operationId = 1;
                            }
                            if (row[7] == 'Продажа') {
                                obj.operationId = 2;
                            }
                            break;
                    }
                    trades.push(obj);
                }
            }
        });

        // cashe processing
        casheBuffer.forEach(rows => {
            if (rows.name == 'Движение ДС') {
                for (var i = 1; i<rows.data.length; i++) {
                    let row = rows.data[i];
                    let obj = {
                        portfolioId: portfolioId,
                        secid: 'RUB',
                        date: moment(new Date((row[1] - 25569)*86400*1000)).format('YYYY-MM-DD'),
                        amount: 1,
                        price: row[4],
                        accint: 0,
                        comission: 0
                    };
                    switch (row[3]) {
                        case 'Ввод ДС':
                            obj.operationId = 1;
                            break;
                        case 'Вывод ДС':
                            obj.operationId = 2;
                            break;
                    }
                    trades.push(obj);
                }
            }
        });

        // add new data to DB

        return createRecords(trades);
    })
    .then(result => {

        console.log('New data inserted into database');

        res.redirect('/portfolio/trades');
    })
    .catch(err => {
        console.log(err);
        return next(err);
    })

}