const promisifyQuery = require('./promisifyQuery');

async function getClient(connection, accountId) {
  const query = 'SELECT * FROM users WHERE liveperson_accountid = ?';

  try {
    return promisifyQuery(connection, query, [accountId]);
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = getClient;
