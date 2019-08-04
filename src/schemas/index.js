const userModel = require('./user/model');
const userModelForm = require('./user/model-form');

const login = require('./user/endpoints/login/login');

const sendMessage = require('./user/actions/send-message/send-message');
const sendMessageForm = require('./user/actions/send-message/send-message-form');

const updateMetadata = require('./user/endpoints/update-metadata/update-metadata');
const updateMetadataForm = require('./user/endpoints/update-metadata/update-metadata-form');

const unregisterClient = require('./user/endpoints/unregister-client/unregister-client');

const getConversationDetails = require('./user/endpoints/conversation-details/conversation-details');

module.exports = {
  user: {
    model: userModel,
    modelForm: userModelForm,
    endpoints: {
      login,
      updateMetadata,
      updateMetadataForm,
      unregisterClient,
      getConversationDetails,
    },
    actions: {
      sendMessage,
      sendMessageForm,
    },
  },
};
