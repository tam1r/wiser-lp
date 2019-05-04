const promisifyQuery = require('./promisifyQuery');

function addClient(connection, credentials) {
  const query = `
    INSERT INTO
    users (
      username,
      accountId,
      password,
      new_conversation_webhook,
      new_file_in_conversation_webhook
    )
    VALUES (
      '${credentials.username}',
      '${credentials.accountId}',
      '${credentials.password}',
      '${credentials.new_conversation_webhook || ''}',
      '${credentials.new_file_in_conversation_webhook || ''}'
    )
  `;

  promisifyQuery(connection, query);
}

module.exports = addClient;
