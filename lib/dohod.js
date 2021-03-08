const fetch = require('node-fetch');
const cheerio = require('cheerio');

const DIVIDENDS_URL = 'https://www.dohod.ru/ik/analytics/dividend';

class Dohod {

    static getHtml(url) {
        return fetch(url).then(response => response.text());
    }

    static getDividends() {
        return new Promise((resolve, reject) => {
            this.getHtml(DIVIDENDS_URL)
            .then(html => {

                var data = [];
                var secids = [];
                var groups = [];
                var periods = [];
                var dividends = [];
                var profits = [];
                var dates = [];
                var dsis = [];

                const $ = cheerio.load(html);

                $('table#table-dividend > tbody > tr > td:nth-child(1)').each((i, elem) => { 

                    let str = $(elem).html().trim();

                    let secid = String(str.split(/[""]/)[1]).replace('/ik/analytics/dividend/','').toUpperCase();

                    let shortname = $(elem).text().trim();

                    secids.push({
                        secid: secid,
                        shortname: shortname,
                    });
                });

                $('table#table-dividend > tbody > tr > td:nth-child(2)').each((i, elem) => {
                    let group = $(elem).text().trim();
                    groups.push({group: group});
                });

                $('table#table-dividend > tbody > tr > td:nth-child(3)').each((i, elem) => {
                    let period = $(elem).text().trim();
                    periods.push({period: period});
                });

                $('table#table-dividend > tbody > tr > td:nth-child(4)').each((i, elem) => {
                    let dividend = $(elem).text().trim();
                    dividends.push({dividend: dividend});
                });

                $('table#table-dividend > tbody > tr > td:nth-child(7)').each((i, elem) => {
                    let profit = $(elem).text().trim();
                    profits.push({profit: profit});
                });

                $('table#table-dividend > tbody > tr > td:nth-child(9)').each((i, elem) => {
                    let date = $(elem).text().trim();

                    date = (date !== 'n/a') ? date : '';

                    dates.push({date: date});
                });

                $('table#table-dividend > tbody > tr > td:nth-child(12)').each((i, elem) => {
                    let dsi = $(elem).text().trim();
                    dsis.push({DSI: dsi});
                });

                for (var i = 0; i<secids.length; i++) {
                    data.push({
                        ...secids[i], 
                        ...groups[i], 
                        ...periods[i],
                        ...dividends[i],
                        ...profits[i],
                        ...dates[i],
                        ...dsis[i]
                    });
                }

                resolve(data);
            })
            .catch(err => {
                console.log(err);
                reject(err);
            });
        });
    }

}

module.exports = Dohod;