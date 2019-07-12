const schema = require('schm');

module.exports = schema({
  accountId: { type: String, required: true },
  convId: { type: String, required: true },
});
