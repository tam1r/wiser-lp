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
      liveperson_accesstokensecret,
      zapier_apikey,
      new_conversation_webhook,
      new_file_in_conversation_webhook
    )
    VALUES (
      '${credentials.username}',
      '${credentials.liveperson_accountid}',
      '${credentials.liveperson_appkey}',
      '${credentials.liveperson_secret}',
      '${credentials.liveperson_accesstoken}',
      '${credentials.liveperson_accesstokensecret}',
      '${credentials.zapier_apikey || ''}',
      '${credentials.new_conversation_webhook || ''}',
      '${credentials.new_file_in_conversation_webhook || ''}'
    )
  `;

  promisifyQuery(connection, query);
}

module.exports = addClient;
