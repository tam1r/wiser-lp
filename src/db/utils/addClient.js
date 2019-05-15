const promisifyQuery = require('./promisifyQuery');

function addClient(connection, credentials) {
  const query = `
    INSERT INTO
    users (
      username,
      liveperson_accountid,
      liveperson_password,
      liveperson_appkey,
      liveperson_secret,
      liveperson_accesstoken,
      liveperson_accesstokensecret,
      new_conversation_webhook,
      new_file_in_conversation_webhook,
      zapier_apikey,
      user_identifier
    )
    VALUES (
      '${credentials.username}',
      '${credentials.liveperson_accountid}',
      '${credentials.liveperson_password || ''}',
      '${credentials.liveperson_appkey || ''}',
      '${credentials.liveperson_secret || ''}',
      '${credentials.liveperson_accesstoken || ''}',
      '${credentials.liveperson_accesstokensecret || ''}',
      '${credentials.new_conversation_webhook || ''}',
      '${credentials.new_file_in_conversation_webhook || ''}',
      '${credentials.zapier_apikey || ''}',
      '${credentials.user_identifier || ''}'
    )
  `;

  console.log(query);

  promisifyQuery(connection, query);
}

module.exports = addClient;
