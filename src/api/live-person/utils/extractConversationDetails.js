const retrieveUserMetadata = require('./retrieveUserMetadata');

function extractConversationDetails(agent, change) {
  return new Promise(async (resolve, reject) => {
    const { result } = change;
    const { conversationDetails, convId: conversationId } = result;
    const { startTs, lastContentEventNotification } = conversationDetails;
    let dialogId = 'ENOENT';

    if (lastContentEventNotification) {
      ({ dialogId } = lastContentEventNotification);
    }

    const consumerId = conversationDetails.participants.filter(p => p.role === 'CONSUMER')[0].id;

    agent.getUserProfile(consumerId, (error, response) => {
      if (error) {
        agent.signale.error(error);
        reject(error);
      }

      resolve({
        timestamp: (new Date(startTs)).toGMTString(),
        phoneNumber: retrieveUserMetadata(response),
        consumerId,
        conversationId,
        dialogId,
      });
    });
  });
}

module.exports = extractConversationDetails;
