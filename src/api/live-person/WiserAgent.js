const signale = require('signale');
const { Agent } = require('node-agent-sdk');
const Sentry = require('@sentry/node');
const { log, triggerWebhook } = require('../../utils');
const Utils = require('./utils');

const reconnectInterval = 5; // seconds
const reconnectAttempts = 35;
const reconnectRatio = 1.25; // ratio to determine reconnect exponential back-off

class WiserAgent extends Agent {
  constructor(credentials, webhooks) {
    super(credentials);
    this.connecting = true;
    this.conf = credentials;
    this.webhooks = webhooks;
    this.consumerId = undefined;
    this.openConversations = {};
    this.signale = signale;
    this.init();
  }

  async sendMessage(params) {
    return new Promise(async (resolve) => {
      const { dialogId, contentType, message } = params;
      this.signale.debug(
        'Send message init',
        'params: \n',
        params,
      );

      switch (contentType) {
        case 'text/plain':
          await this.publishEvent({
            dialogId,
            event: {
              type: 'ContentEvent',
              contentType,
              message,
            },
          }, (error, response) => {
            if (error) {
              this.signale.fatal(
                'Error sending message:\n',
                JSON.stringify(error),
              );
              resolve({
                code: error.code,
                message: error.body,
              });
            }

            this.signale.success(
              'Send message response:\n',
              JSON.stringify(response),
            );

            resolve({
              code: 200,
              message: 'Message sent',
            });
          });
          break;

        default:
          resolve({
            code: 405,
            message: 'Method not supported',
          });
          break;
      }
    });
  }

  init() {
    this.on('connected', () => {
      this.connecting = false;
      if (this._retryConnection) clearTimeout(this._retryConnection);

      this.signale.success(
        log.success(`Successfully connected agent with accountId: ${this.conf.accountId}`),
      );

      this.signale = this.signale.scope(this.conf.accountId);

      // make the agent visibity to "online"
      this.setAgentState({ availability: 'ONLINE' });

      this.subscribeExConversations({ convState: ['OPEN'] }, (error, response) => {
        if (error) {
          this.signale.error(error);
          return;
        }

        this.signale.success(
          log.success('Successfully subscribed to new conversations\n'),
          log.info(`\t\t\t\tsubscriptionId: ${JSON.stringify(response.subscriptionId)}\n`),
          log.info(`\t\t\t\taccountId: ${this.conf.accountId}`),
        );
      });

      this.subscribeRoutingTasks({});

      this.pingClock = setInterval(this.getClock, 30000); // keep alive connection strategy
    });

    this.on('routing.RoutingTaskNotification', (body) => {
      body.changes.forEach((c) => {
        if (c.type === 'UPSERT') {
          c.result.ringsDetails.forEach((r) => {
            if (r.ringState === 'WAITING') {
              this.updateRingState({
                ringId: r.ringId,
                ringState: 'ACCEPTED',
              }, (e, resp) => console.log(resp));
            }
          });
        }
      });
    });

    // Notification on changes in the open consversation list
    this.on('cqm.ExConversationChangeNotification', (notificationBody) => {
      notificationBody.changes.forEach(async (change) => {
        const { convId, conversationDetails } = change.result;
        const { startTs } = conversationDetails;

        const messageDetails = await Utils.extractMessageDetails(change, this.signale);
        const parsedConversationDetails = await Utils.extractConversationDetails(this, change);

        // new_message_arrived trigger
        if (this.webhooks.new_message_arrived) {
          await triggerWebhook(this.webhooks.new_message_arrived, {
            convId,
            convDetails: parsedConversationDetails,
          });

          this.signale.success(
            log.success(`successfully triggered 'new_message_arrived' webhook: ${this.webhooks.new_message_arrived}\n`),
            log.info(`\t\t\tconvId: ${convId}\n`),
            log.info(`\t\t\taccountId: ${this.conf.accountId}\n`),
            log.info(`\t\t\tconvDetails: ${log.obj(parsedConversationDetails)}\n`),
          );
        }

        if (messageDetails.type === 'hosted/file') {
          const fileURL = await Utils.generateURLForDownloadFile(this, messageDetails.relativePath);

          if (this.webhooks.new_file_in_conversation_webhook) {
            await triggerWebhook(this.webhooks.new_file_in_conversation_webhook, {
              fileURL,
              convId,
              convDetails: parsedConversationDetails,
            });

            this.signale.success(
              log.success(`successfully triggered 'new_file_in_conversation' webhook: ${this.webhooks.new_file_in_conversation_webhook}\n`),
              log.info(`\t\t\tconvId: ${convId}\n`),
              log.info(`\t\t\taccountId: ${this.conf.accountId}\n`),
              log.info(`\t\t\tconvDetails: ${log.obj(parsedConversationDetails)}`),
            );
          }

          this.signale.success(
            log.success('Successfully generated download file URL!\n'),
            log.info(`\t\t\tConvId: ${convId}\n`),
            log.info(`\t\t\tURL: ${fileURL}`),
          );
        }

        if (
          change.type === 'UPSERT'
          && !this.openConversations[convId]
          && Utils.isConversationRecentlyCreated(startTs)
        ) {
          // New conversation
          this.openConversations[convId] = {};

          if (this.webhooks.new_conversation_webhook) {
            await triggerWebhook(this.webhooks.new_conversation_webhook, parsedConversationDetails);
            log.success(
              `successfully triggered webhook: ${this.webhooks.new_conversation_webhook}
              accountId: ${this.conf.accountId}
              convId: ${convId}
              convDetails: ${log.object(parsedConversationDetails)}`,
            );
          }

          // This method is used to create a subscription for all of the Messaging Events in
          // a particular conversation. This includes messages sent by any participant in the
          // conversation, as well as "agent is typing" or "visitor is typing" notifications and
          // notifications when a message has been read by a participant.
          this.subscribeMessagingEvents({ dialogId: convId });
        } else if (
          change.type === 'UPSERT'
          && this.openConversations[convId]
          && change.result.conversationDetails.participants.filter(p => p.role === 'CONSUMER')[0].id !== this.consumerId
        ) {
          // ConsumerID changed. Typically, a Step Up from
          // an unauthenticated to an authenticated user.
          this.consumerId = change.result.conversationDetails.participants.filter(p => p.role === 'CONSUMER')[0].id;

          this.getUserProfile(this.consumerId, (e, profileResp) => {
            console.log('consumer id changed: ', profileResp);
          });
        } else if (change.type === 'DELETE') {
          // conversation was closed or transferred
          delete this.openConversations[convId];
        } else {
          // something else happened
          this.signale.debug(
            log.gray(`Unhandled event occured in conversation: ${convId}`),
          );
        }
      });
    });

    this._reconnect = (delay = reconnectInterval, attempt = 1) => {
      // implementation reference:
      // https://github.com/LivePersonInc/node-agent-sdk#closed

      const { username: agent } = this.conf;
      const nextDelay = delay * 1000;

      if (this.connecting) {
        this._retryConnection = setTimeout(() => {
          this.signale.debug(
            log.warning(`Attempting to reconnect agent ${agent} | attempt ${attempt} | next delay ${nextDelay}`),
          );

          if (this.connecting) {
            this.reconnect();

            if (++attempt <= reconnectAttempts) { // eslint-disable-line
              this._reconnect(reconnectInterval * reconnectRatio, attempt);
            }
          }
        }, nextDelay);
      }
    };

    this.on('error', (error) => {
      Sentry.captureException(error);

      this.signale.fatal(new Error(log.obj(error)));

      if (error && error.code === 401) {
        this.connecting = true;
        this._reconnect();
      }
    });

    this.on('closed', () => {
      this.signale.fatal(new Error('Socket closed'));

      clearInterval(this.pingClock);
      this.connecting = true;
      this._reconnect();
    });
  }
}

module.exports = WiserAgent;

/*

Reference Code:

// Echo every unread consumer message and mark it as read
// this.on('ms.MessagingEventNotification', (body) => {
//   const respond = {};
//   body.changes.forEach((c) => {
//     // In the current version MessagingEventNotification
//     // are recived also without subscription
//     // Will be fixed in the next api version.
//     // So we have to check if this notification is handled by us.
//     if (openConversations[c.dialogId]) {
//       // add to respond list all content event not by me
//       if (c.event.type === 'ContentEvent' && c.originatorId !== this.agentId) {
//         respond[`${body.dialogId}-${c.sequence}`] = {
//           dialogId: body.dialogId,
//           sequence: c.sequence,
//           message: c.event.message,
//         };
//       }
//       // remove from respond list all the messages that were already read
//       if (c.event.type === 'AcceptStatusEvent' && c.originatorId === this.agentId) {
//         c.event.sequenceList.forEach((seq) => {
//           delete respond[`${body.dialogId}-${seq}`];
//         });
//       }
//     }
//   });
//
//   // publish read, and echo
//   Object.keys(respond).forEach((key) => {
//     const contentEvent = respond[key];
//     this.publishEvent({
//       dialogId: contentEvent.dialogId,
//       event: {
//         type: 'AcceptStatusEvent', status: 'READ', sequenceList: [contentEvent.sequence] },
//     });
//     this.emit(this.CONTENT_NOTIFICATION, contentEvent);
//   });
// });

*/
