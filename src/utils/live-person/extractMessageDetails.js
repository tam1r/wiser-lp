const { log } = require('../index');

function extractMessageDetails(change) {
  const {
    convId,
    lastContentEventNotification: notification,
  } = change.result;

  const userId = notification.originatorPId;

  // const userMetadata = notification.originatorMetadata;
  // in userMetadata lives the following object
  // "originatorMetadata": {
  //   "id": "69deded8-562f-54cd-b0da-ec87cc234b5a",
  //   "role": "ASSIGNED_AGENT",
  //   "clientProperties": {
  //     "type": ".ClientProperties",
  //     "ipAddress": "10.42.138.109",
  //     "deviceFamily": "DESKTOP",
  //     "os": "WINDOWS",
  //     "osVersion": "10.0",
  //     "integrationVersion": "3.0.25",
  //     "browser": "CHROME",
  //     "browserVersion": "73.0.3683.103"
  //   }
  // },

  const { contentType, message } = notification.event;

  if (contentType === 'text/plain') {
    log.info(`New message!\nConversation id: ${convId}\nDialogId: ${notification.dialogId}\nFrom userId: ${userId}\nMessage: ${message}`);
  }

  // Use the `generateURLForDownloadFile` method
  // if (contentType === 'hosted/file') {
  //   // TODO: Finish user cases shown in the user stories
  //   const { fileType } = message;
  //
  //   if (fileType === 'MP3') {
  //
  //   }
  // }
}

module.exports = extractMessageDetails;
