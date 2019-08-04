const schema = require('schm');

module.exports = schema({
  accountId: { type: String, required: true },
  password: { type: String, required: true },
});
