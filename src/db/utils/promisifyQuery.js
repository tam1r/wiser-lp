const { log } = require('../../utils');

function promisifyQuery(connection, query) {
  return new Promise(async (resolve, reject) => {
    await connection.query(query, (error, response) => {
      if (error) {
        log.error(`Error processing query:\nQuery: ${log.object(query)}\nError message: ${log.object(error)}`);
        reject(new Error('Error processing query'));
      }

      resolve(response);
    });
  });
}

module.exports = promisifyQuery;
