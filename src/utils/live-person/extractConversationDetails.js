const { log } = require('../index');

function extractConversationDetails(change) {
  // TODO: extract relevant metadata and return it
  const { participants, state } = change.result.conversationDetails;
  const { convId: conversationId } = change.result;

  log.info(`Conversation details:\nConversationId: ${conversationId}\nParticipants: ${log.object(participants)}\nState: ${state}`);
}

module.exports = extractConversationDetails;
