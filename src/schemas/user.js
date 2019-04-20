const schema = require('schm');

module.exports = schema({
  username: { type: String, required: true },
  liveperson_accountid: { type: String, required: true },
  liveperson_appkey: { type: String, required: true },
  liveperson_secret: { type: String, required: true },
  liveperson_accesstoken: { type: String, required: true },
  liveperson_accesstokensecret: { type: String, required: true },
  zapier_apikey: { type: String, required: false },
});
