const { log } = require('../../../utils');

function extractConversationDetails(change) {
  return new Promise(async (resolve) => {
    const { participants, state } = change.result.conversationDetails;
    const { convId: conversationId } = change.result;

    log.info(`Conversation details:\nConversationId: ${conversationId}\nParticipants: ${log.object(participants)}\nState: ${state}`);

    resolve(change.result.conversationDetails);
  });
}

module.exports = extractConversationDetails;
