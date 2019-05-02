const { log } = require('./utils');
const { promisifyQuery } = require('./db');
const livePersonServiceInit = require('./service/live-person');

async function initService(connection) {
  const agents = {};

  log.info('Starting wiser-lp service');

  // retrieve all users
  const response = await promisifyQuery(connection, 'SELECT * FROM users');
  response.forEach(async (user) => {
    agents[user.accountId] = await livePersonServiceInit({
      username: user.username,
      accountId: user.accountId,
      password: user.password,
    });

    log.info(`Started liveperson service for user: ${user.username}`);
  });

  log.message('Agents accountIds:', Object.keys(agents));
  return agents;
}

module.exports = initService;
