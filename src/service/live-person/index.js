const {
  connectAgent,
  subscribeToConversations,
} = require('../../api/live-person');
const {
  // isConversationRecentlyCreated,
  extractConversationDetails,
  extractMessageDetails,
} = require('../../utils/live-person');
const { log } = require('../../utils');

async function livePersonServiceInit(credentials) {
  const agent = await connectAgent(credentials);

  await subscribeToConversations(agent);

  // on new message in a conversation
  agent.on('cqm.ExConversationChangeNotification', (notification) => {
    log.message('New notification received!');

    notification.changes.forEach((change) => {
      // if (isConversationRecentlyCreated()) {}

      extractConversationDetails(change);
      extractMessageDetails(change);
    });
  });
}

module.exports = livePersonServiceInit;
