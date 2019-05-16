const { log } = require('./utils');
const { promisifyQuery } = require('./db');
const WiserAgent = require('./api/live-person/WiserAgent');

async function initService(connection) {
  const agents = {};

  log.info('Starting wiser-lp service');

  // retrieve all users
  const response = await promisifyQuery(connection, 'SELECT * FROM users');

  if (response.length) {
    response.forEach(async (user) => {
      let credentials;
      if (user.liveperson_password && user.liveperson_password !== '') { // login using username/password
        credentials = {
          username: user.username,
          accountId: user.liveperson_accountid,
          password: user.liveperson_password,
        };
      } else { // login using accesstoken
        credentials = {
          username: user.username,
          accountId: user.liveperson_accountid,
          appKey: user.liveperson_appkey,
          secret: user.liveperson_secret,
          accessToken: user.liveperson_accesstoken,
          accessTokenSecret: user.liveperson_accesstokensecret,
        };
      }

      const webhooks = {
        new_conversation_webhook: user.new_conversation_webhook,
        new_file_in_conversation_webhook: user.new_file_in_conversation_webhook,
      };
      agents[user.liveperson_accountid] = new WiserAgent(credentials, webhooks);

      log.info(`Started liveperson service for user: ${user.username} | ${user.liveperson_accountid}`);
    });
  } else {
    log.message('No agents existing in the database');
  }

  return agents;
}

module.exports = initService;
