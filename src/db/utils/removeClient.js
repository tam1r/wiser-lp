const promisifyQuery = require('./promisifyQuery');

async function removeClient(connection, accountId) {
  const query = `DELETE FROM users WHERE users.liveperson_accountid = '${accountId}'`;

  console.log(query);

  try {
    return promisifyQuery(connection, query);
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = removeClient;
