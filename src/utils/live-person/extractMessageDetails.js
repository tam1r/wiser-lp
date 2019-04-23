const { log } = require('../index');

function extractMessageDetails(agent, change) {
  return new Promise((resolve) => {
    const {
      convId,
      lastContentEventNotification: notification,
    } = change.result;

    const userId = notification.originatorPId;

    const { contentType, message } = notification.event;

    if (contentType === 'text/plain') {
      log.info(`New text message!\nConversation id: ${convId}\nDialogId: ${notification.dialogId}\nFrom userId: ${userId}\nMessage: ${message}`);
      resolve({ type: contentType });
    }

    if (contentType === 'hosted/file') {
      const { relativePath } = message;
      log.info(`New media message!\nConversation id: ${convId}\nDialogId: ${notification.dialogId}\nFrom userId: ${userId}\nRelative Path: ${relativePath}`);
      resolve({ type: contentType, relativePath });
    }
  });
}

module.exports = extractMessageDetails;
