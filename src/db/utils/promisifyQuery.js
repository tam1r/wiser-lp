const signale = require('signale');
const { log } = require('../../utils');

function promisifyQuery(connection, query) {
  return new Promise(async (resolve, reject) => {
    await connection.query(query, (error, response) => {
      if (error) {
        signale.fatal(
          log.error('Error processing query\n'),
          log.error(query),
          log.error(`Error message: ${log.obj(error)}`),
        );

        reject(new Error(error));
      }

      resolve(response);
    });
  });
}

module.exports = promisifyQuery;
