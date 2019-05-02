const schema = require('schm');

module.exports = schema({
  dialogId: { type: String, required: true },
  contentType: { type: String, required: true },
  message: { type: String, required: true },
});
