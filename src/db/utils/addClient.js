const promisifyQuery = require('./promisifyQuery');

function addClient(connection, credentials) {
  const {
    username,
    liveperson_accountid,
    liveperson_password,
    liveperson_appkey,
    liveperson_secret,
    liveperson_accesstoken,
    liveperson_accesstokensecret,
    webhooks,
  } = credentials;
  let new_conversation_webhook = null;
  let new_file_in_conversation_webhook = null;
  let new_message_arrived_webhook = null;
  let coordinates_webhook = null;

  if (webhooks) {
    ({
      new_conversation_webhook,
      new_file_in_conversation_webhook,
      new_message_arrived_webhook,
      coordinates_webhook,
    } = webhooks);
  }

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
      new_message_arrived_webhook,
      coordinates_webhook
    )
    VALUES (
      '${username}',
      '${liveperson_accountid}',
      '${liveperson_password || ''}',
      '${liveperson_appkey || ''}',
      '${liveperson_secret || ''}',
      '${liveperson_accesstoken || ''}',
      '${liveperson_accesstokensecret || ''}',
      '${new_conversation_webhook || ''}',
      '${new_file_in_conversation_webhook || ''}',
      '${new_message_arrived_webhook || ''}',
      '${coordinates_webhook || ''}'
    )
  `;

  console.log(query);

  promisifyQuery(connection, query);
}

module.exports = addClient;
