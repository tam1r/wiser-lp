const mysql = require('mysql');

const { log } = require('../../utils');

const credentials = {
  production: {

  },
  development: {
    host: process.env.DEV_DB_HOST,
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
  },
};

function connect() {
  return new Promise(async (resolve, reject) => {
    let connection;

    if (process.env.NODE_ENV === 'production') {
      connection = mysql.createConnection(credentials.production);
    } else {
      connection = mysql.createConnection(credentials.development);
    }

    await connection.connect((err) => {
      if (err) {
        log.error('Connection error:');
        log.message(log.object(err));
        reject(new Error('Error connecting to database'));
      }
    });

    resolve(connection);
  });
}

module.exports = connect;
