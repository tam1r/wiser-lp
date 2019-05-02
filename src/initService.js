const { log } = require('./utils');
const { promisifyQuery } = require('./db');
const livePersonServiceInit = require('./service/live-person');

async function initService(connection) {
  const agents = {};

  log.info('Starting wiser-lp service');

  // retrieve all users
  const response = await promisifyQuery(connection, 'SELECT * FROM users');

  if (response.length) {
    response.forEach(async (user) => {
      const credentials = {
        username: user.username,
        accountId: user.liveperson_accountid,
        appKey: user.liveperson_appkey,
        secret: user.liveperson_secret,
        accessToken: user.liveperson_accesstoken,
        accessTokenSecret: user.liveperson_accesstokensecret,
      };
      agents[user.liveperson_accountid] = await livePersonServiceInit(credentials);

      log.info(`Started liveperson service for user: ${user.username} | ${user.liveperson_accountid}`);
    });
  } else {
    log.message('No agents existing in the database');
  }

  return agents;
}

module.exports = initService;
