const schema = require('schm');

module.exports = schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  accountId: { type: String, required: true },
  zapier_apikey: { type: String, required: false },
});
