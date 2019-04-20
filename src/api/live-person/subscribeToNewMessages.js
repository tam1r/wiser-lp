const { Agent } = require('node-agent-sdk');
const chalk = require('chalk');

const { log } = require('../../utils');

async function subscribeToNewMessages(credentials) {
  log.message('credentials ' + log.object(credentials));
  const agent = new Agent(credentials);

  agent.on('connected', () => {
    // subscribe to all conversations in the account
    agent.subscribeExConversations({ convState: ['OPEN'] }, (error, response) => {
      log.info('subscribed successfully');
      log.message(`error object: ${log.object(error)}`);
      log.message(`response object: ${log.object(response)}`);
    });
  });

  // log all conversation updates
  agent.on('cqm.ExConversationChangeNotification', ({ changes }) => {
    changes.forEach((change) => {
      const participant = change.result.conversationDetails.participants
        .filter(p => p.id === agent.agentId)[0];
      const myRole = participant && participant.role;

      console.log(chalk.green(`particpant: ${participant} - myRole: ${myRole}`));
    });
  });
}

module.exports = subscribeToNewMessages;
