const moment = require('moment-timezone');

function isConversationRecentlyCreated(timestamp, tz) {
  const conversationStartTime = moment.tz(timestamp, tz);
  const now = moment.tz(tz).subtract(1, 'minutes'); // subtract 1 minute to current time as a threshold
  const diff = moment.duration(conversationStartTime.diff(now));
  const isRecentlyCreated = now.valueOf() < conversationStartTime.valueOf();

  console.log(
    `
    conversationStartTime: ${conversationStartTime.valueOf()}
    now: ${now.valueOf()}
    diff: ${diff.humanize()}
    diffVal: ${diff.valueOf()}
    isRecentlyCreated: ${isRecentlyCreated}
    `,
  );

  if (isRecentlyCreated) {
    return true;
  }

  return false;
}

module.exports = isConversationRecentlyCreated;
