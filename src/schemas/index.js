const userModel = require('./user/model');
const login = require('./user/endpoints/login');
const sendMessage = require('./user/actions/send-message');
const updateMetadata = require('./user/endpoints/update-metadata');
const unregisterClient = require('./user/endpoints/unregister-client');
const getConversationDetails = require('./user/endpoints/conversation-details');

module.exports = {
  user: {
    model: userModel,
    endpoints: {
      login,
      updateMetadata,
      unregisterClient,
      getConversationDetails,
    },
    actions: {
      sendMessage,
    },
  },
};
