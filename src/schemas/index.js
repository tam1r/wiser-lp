const userModel = require('./user/model');
const sendMessage = require('./user/actions/send-message');
const updateMetadata = require('./user/endpoints/update-metadata');
const unregisterClient = require('./user/endpoints/unregister-client');

module.exports = {
  user: {
    model: userModel,
    endpoints: {
      updateMetadata,
      unregisterClient,
    },
    actions: {
      sendMessage,
    },
  },
};
