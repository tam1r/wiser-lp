const { log } = require('./utils');
const { promisifyQuery } = require('./db');
const livePersonServiceInit = require('./service/live-person');

async function initService(connection) {
  log.info('Starting wiser-lp service');

  // retrieve all users
  const response = await promisifyQuery(connection, 'SELECT * FROM users');
  response.forEach((user) => {
    const userCredentials = {
      username: user.username,
      accountId: user.accountId,
      password: user.password,
    };

    livePersonServiceInit(userCredentials);

    log.info(`Started liveperson service for user: ${user.username}`);
  });
}

module.exports = initService;
