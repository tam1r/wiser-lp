const schema = require('schm');

module.exports = schema({
  username: { type: String, required: true },
  liveperson_password: { type: String, required: false },
  liveperson_accountid: { type: String, required: true },
  liveperson_appkey: { type: String, required: false },
  liveperson_secret: { type: String, required: false },
  liveperson_accesstoken: { type: String, required: false },
  liveperson_accesstokensecret: { type: String, required: false },
  webhooks: {
    type: Object,
    required: false,
    properties: {
      new_file_in_conversation_webhook: {
        type: String,
        required: false,
      },
      new_conversation_webhook: {
        type: String,
        required: false,
      },
      new_message_arrived_webhook: {
        type: String,
        required: false,
      },
      coordinates_webhook: {
        type: String,
        required: false,
      },
    },
  },
});
