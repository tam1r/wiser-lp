const { log } = require('./utils');
const { promisifyQuery } = require('./db');
const { subscribeToNewMessages } = require('./api/live-person');

async function initService(connection) {
  log.info('Starting wiser-lp service');

  // retrieve all users
  const response = await promisifyQuery(connection, 'SELECT * FROM users');
  response.forEach((user) => {
    // start listening for new messages
    subscribeToNewMessages({
      username: user.username,
      accountId: user.accountId,
      password: user.password,
    });
    log.info(`Started service for user: ${user.username}`);
  });
}

module.exports = initService;
