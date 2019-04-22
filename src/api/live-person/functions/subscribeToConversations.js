const { log } = require('../../../utils');

function subscribeToConversations(agent) {
  return new Promise((resolve, reject) => {
    agent.subscribeExConversations({ convState: ['OPEN'] }, (error) => {
      if (error) {
        log.message(`Error object: ${log.object(error)}`);
        reject(new Error('Error subscribing to conversations'));
      }

      log.info('Subscribed to all conversations successfully');
      resolve(agent);
    });
  });
}

module.exports = subscribeToConversations;
