const fetch = require('node-fetch');

module.exports =  function (url, options, timeout = 5000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => {
                let err = new Error('Service unavailable');
                err.status = 500;
                reject(err);
            }, timeout)
        )
    ]);
}