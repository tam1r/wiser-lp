const mysql = require('mysql');

const { log } = require('../../utils');

const credentials = {
  production: {
    host: process.env.CLEARDB_DATABASE_URL,
    user: process.env.CLEARDB_DATABASE_USER,
    password: process.env.CLEARDB_DATABASE_PASSWORD,
  },
  development: {
    host: process.env.DEV_DB_HOST,
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
  },
};

function connect() {
  return new Promise(async (resolve, reject) => {
    const connection = mysql.createConnection(credentials[`${process.env.NODE_ENV}`]);

    await connection.connect((err) => {
      if (err) {
        log.error('Connection error:');
        log.message(log.object(err));
        reject(new Error('Error connecting to database'));
      } else {
        log.message(`Established connection with host: ${credentials[`${process.env.NODE_ENV}`].host}`);
      }
    });

    resolve(connection);
  });
}

module.exports = connect;
