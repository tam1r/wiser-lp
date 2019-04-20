const promisifyQuery = require('./promisifyQuery');

function addClient(connection, credentials) {
  const query = `
    INSERT INTO
    users (
      username,
      liveperson_accountid,
      liveperson_appkey,
      liveperson_secret,
      liveperson_accesstoken,
      liveperson_accesstokensecret
    )
    VALUES (
      '${credentials.username}',
      '${credentials.liveperson_accountid}',
      '${credentials.liveperson_appkey}',
      '${credentials.liveperson_secret}',
      '${credentials.liveperson_accesstoken}',
      '${credentials.liveperson_accesstokensecret}'
    )
  `;

  promisifyQuery(connection, query);
}

module.exports = addClient;
