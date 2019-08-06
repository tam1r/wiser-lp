const schema = require('schm');

module.exports = schema({
  accountId: { type: String, required: true },
  liveperson_password: { type: String, required: false },
  liveperson_appkey: { type: String, required: false },
  liveperson_secret: { type: String, required: false },
  liveperson_accesstoken: { type: String, required: false },
  liveperson_accesstokensecret: { type: String, required: false },
  new_file_in_conversation_webhook: { type: String, required: false },
  new_conversation_webhook: { type: String, required: false },
  new_message_arrived_webhook: { type: String, required: false },
  coordinates_webhook: { type: String, required: false },
});
