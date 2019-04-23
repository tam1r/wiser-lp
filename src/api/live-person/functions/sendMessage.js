async function sendMessage(agent, req) {
  const { dialogId, contentType, message } = req;

  if (contentType === 'text/plain') {
    await agent.publishEvent({
      dialogId,
      event: {
        type: 'ContentEvent',
        contentType,
        message,
      },
    });
  }
}

module.exports = sendMessage;
