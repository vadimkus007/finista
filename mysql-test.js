const mysql = require('mysql2');

console.log('Get connection...');
const connection = mysql.createConnection({
    database: 'finista',
    host: 'localhost',
    user: 'root',
    password: '1qaz0okm'
});

connection.connect(function(err) {
    if (err) throw err;
    console.log('Connected!');
});

connection.end();
console.log('Connection closed!');