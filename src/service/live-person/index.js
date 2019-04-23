const {
  connectAgent,
  subscribeToConversations,
  generateURLForDownloadFile,
} = require('../../api/live-person');
const {
  isConversationRecentlyCreated,
  extractConversationDetails,
  extractMessageDetails,
} = require('../../utils/live-person');
const { log } = require('../../utils');
const {
  triggerWebhook,
} = require('../../api/zapier');

async function livePersonServiceInit(credentials) {
  const agent = await connectAgent(credentials);

  await subscribeToConversations(agent);

  // on new message in a conversation
  agent.on('cqm.ExConversationChangeNotification', (notification) => {
    log.message('New notification received!');

    notification.changes.forEach(async (change) => {
      const { convId } = change.result;
      const { startTs } = change.result.conversationDetails;

      if (isConversationRecentlyCreated(startTs)) {
        const conversationDetails = extractConversationDetails(change);
        await triggerWebhook('https://hooks.zapier.com/hooks/catch/1646904/7pkzff/', conversationDetails);
        log.success(`Successfully retrieved recently created conversation details!\nConvId:   ${convId}`);
      }

      const messageDetails = await extractMessageDetails(agent, change);

      if (messageDetails.type === 'hosted/file') {
        const fileURL = await generateURLForDownloadFile(agent, messageDetails.relativePath);
        await triggerWebhook('https://hooks.zapier.com/hooks/catch/1646904/7pk8w6/', { fileURL });
        log.success(`Successfully generated download file URL!\nConvId:   ${convId}\nURL:      ${fileURL}`);
      }
    });
  });
}

module.exports = livePersonServiceInit;
