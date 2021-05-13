const moment = require('moment');

class Sber {

    // parse data from xls files
    // return [{ trades for store in database with appropriate fields }]
    static parse(data) {

        var result = [];

        data.forEach(row => {
            if (row.name == 'Сделки') {
                const data = row.data;

                if (data.length > 1) {
                    for (var i = 1; i < data.length; i++) {
                        var [,,date,,secid,group,,operation,amount,price,accint,cost,currency,,comission1,comission2] = data[i];
                        let operationId = 0;

                        if (group === 'Другой') {
                            group = 'ETF';
                        }

                        switch (operation) {
                            case 'Покупка':
                                if (group == 'Облигация') {
                                    operationId = 7;
                                } else {
                                    operationId = 1;
                                }
                                break;
                            case 'Продажа':
                                if (group == 'Облигация') {
                                    operationId = 8;
                                } else {
                                    operationId = 2;
                                }
                                break;
                            case 'Дивиденд':
                                operationId = 3;
                                break;
                            case 'Купон':
                                operationId = 5;
                                break;
                            default:
                                break;
                        }

                        let obj = {
                            date: moment(new Date((date - 25569)*86400*1000)).format('YYYY-MM-DD'),
                            secid: secid,
                            group: group,
                            operationId: operationId,
                            amount: amount,
                            price: price,
                            accint: accint,
                            comission: comission1 + comission2
                        };
                        result.push(obj);
                    } // for
                }
            } // Сделки

            if (row.name === 'Движение ДС') {
                const data = row.data;
                if (data.length > 1) {
                    for (var i = 1; i<data.length;i++) {
                        const [,,date,operation,price,currency] = data[i];
                        let obj = {
                            secid: currency,
                            date: moment(new Date((date - 25569)*86400*1000)).format('YYYY-MM-DD'),
                            amount: 1,
                            price: price,
                            accint: 0,
                            comission: 0
                        };
                        if (operation == 'Ввод ДС') {
                            obj.operationId = 1;
                        } else {
                            obj.operationId = 2;
                        }
                        result.push(obj);
                    }
                }

            } // Движение ДС

        });

        return result;

    } // parse

}

module.exports = Sber;