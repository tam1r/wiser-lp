const schema = require('schm');

module.exports = schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  accountId: { type: String, required: true },
  new_conversation_webhook: { type: String, required: false },
  new_file_in_conversation_webhook: { type: String, required: false },
});
