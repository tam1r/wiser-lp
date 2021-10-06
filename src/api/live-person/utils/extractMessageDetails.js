const { log } = require('../../../utils');

function extractMessageDetails(change) {
  return new Promise((resolve) => {
    const {
      convId,
      lastContentEventNotification: notification,
    } = change.result;

    if (notification) {
      const userId = notification.originatorPId || 'NOT_FOUND';
      const { contentType, message } = notification.event;

      if (contentType === 'text/plain') {
        log.info(`New text message: ${log.object({ conversationId: convId, dialogId: notification.dialogId, from: userId, message})}`);
        resolve({ type: contentType });
      }

      if (contentType === 'hosted/file') {
        const { relativePath } = message;
        log.info(`New media message: ${log.object({ conversationId: convId, dialogId: notification.dialogId, from: userId, relativePath})}`);
        resolve({ type: contentType, relativePath });
      }
    }
  });
}

module.exports = extractMessageDetails;
