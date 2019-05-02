const promisifyQuery = require('./promisifyQuery');

function addClient(connection, credentials) {
  const query = `
    INSERT INTO
    users (
      username,
      password,
      accountId
    )
    VALUES (
      '${credentials.username}',
      '${credentials.password}',
      '${credentials.accountId}'
    )
  `;

  promisifyQuery(connection, query);
}

module.exports = addClient;
