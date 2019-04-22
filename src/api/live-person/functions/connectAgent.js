const { Agent } = require('node-agent-sdk');
const { log } = require('../../../utils');

function connectAgent(credentials) {
  return new Promise((resolve) => {
    const agent = new Agent(credentials);

    agent.on('connected', () => {
      log.message(`> Successfully connected agent ${agent.agentId}`);
      resolve(agent);
    });
  });
}

module.exports = connectAgent;
