function isConversationRecentlyCreated(timestamp) {
  const conversationStartTime = new Date(timestamp);
  const now = new Date();

  // substract 5 minutes to current time as a threshold
  now.setMinutes(now.getMinutes() - 5);

  if (now > conversationStartTime) {
    return false;
  }

  return true;
}

module.exports = isConversationRecentlyCreated;
