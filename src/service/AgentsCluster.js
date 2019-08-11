const signale = require('signale');
const { log } = require('../utils');
const { promisifyQuery } = require('../db');
const WiserAgent = require('../api/live-person/WiserAgent');

class AgentsCluster {
  constructor(connection) {
    this.agents = {};
    this.connection = connection;
    this.init();
  }

  async updateAgent(conf) {
    try {
      const {
        accountId,
        liveperson_appkey,
        liveperson_secret,
        liveperson_accesstoken,
        liveperson_accesstokensecret,
        webhooks,
      } = conf;
      let new_conversation_webhook = null;
      let new_file_in_conversation_webhook = null;
      let new_message_arrived_webhook = null;
      let coordinates_webhook = null;

      if (webhooks) {
        ({
          new_conversation_webhook,
          new_file_in_conversation_webhook,
          new_message_arrived_webhook,
          coordinates_webhook,
        } = webhooks);
      }

      const agentConf = this.agents[accountId].getConf();
      const oldWebhooks = this.agents[accountId].getWebhooks();

      const {
        new_conversation_webhook: prev_new_conversation_webhook,
        new_file_in_conversation_webhook: prev_new_file_in_conversation_webhook,
        new_message_arrived_webhook: prev_new_message_arrived_webhook,
        coordinates_webhook: prev_coordinates_webhook,
      } = oldWebhooks;

      // TODO: Add the rest of the remaing fields.
      await promisifyQuery(this.connection, `
        UPDATE users
        SET
          liveperson_appkey = '${liveperson_appkey || agentConf.liveperson_appkey || ''}',
          liveperson_secret = '${liveperson_secret || agentConf.liveperson_secret || ''}',
          liveperson_accesstoken = '${liveperson_accesstoken || agentConf.liveperson_accesstoken || ''}',
          liveperson_accesstokensecret = '${liveperson_accesstokensecret || agentConf.liveperson_accesstokensecret || ''}',
          new_conversation_webhook = '${new_conversation_webhook || prev_new_conversation_webhook || ''}',
          new_file_in_conversation_webhook = '${new_file_in_conversation_webhook || prev_new_file_in_conversation_webhook || ''}',
          new_message_arrived_webhook = '${new_message_arrived_webhook || prev_new_message_arrived_webhook || ''}',
          coordinates_webhook = '${coordinates_webhook || prev_coordinates_webhook || ''}'
        WHERE users.liveperson_accountid = '${accountId}'
      `);
    } catch (error) {
      throw error;
    }
  }

  async getConversationDetails(agentId, convId) {
    return new Promise((resolve, reject) => {
      const agent = this.agents[agentId];

      if (!agent) {
        return reject(new Error(`There is no existing agent with id: ${agentId}`));
      }

      if (!agent.openConversations[convId]) {
        return reject(new Error(`There is no existing open conversation with id: ${convId}`));
      }

      return resolve(agent.openConversations[convId].conversationDetails);
    });
  }

  async getConversations(agentId) {
    return new Promise((resolve, reject) => {
      const agent = this.agents[agentId];

      if (!agent) {
        return reject(new Error(`There is no existing agent with id: ${agentId}`));
      }

      return resolve(agent.openConversations);
    });
  }

  async init() {
    log.info('Starting wiser-lp service');

    // retrieve all users
    const response = await promisifyQuery(this.connection, 'SELECT * FROM users');

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
          new_message_arrived_webhook: user.new_message_arrived_webhook,
          coordinates_webhook: user.coordinates_webhook,
        };

        this.agents[user.liveperson_accountid] = new WiserAgent(credentials, webhooks);

        signale.success(
          log.success(`Started liveperson service for user: ${user.username} | ${user.liveperson_accountid}`),
        );
      });
    } else {
      signale.debug(
        log.warning('No agents existing in the database'),
      );
    }
  }
}

module.exports = AgentsCluster;
