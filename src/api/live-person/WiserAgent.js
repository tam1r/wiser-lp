const { Agent } = require('node-agent-sdk');
const { triggerWebhook } = require('../zapier/functions');
const { log } = require('../../utils');
const {
  generateURLForDownloadFile,
  extractConversationDetails,
  extractMessageDetails,
} = require('./functions');

class WiserAgent extends Agent {
  constructor(conf) {
    super(conf);
    this.conf = conf;
    this.consumerId = undefined;
    this.openConversations = {};
    this.init();
  }

  async sendMessage(params) {
    const { dialogId, contentType, message } = params;
    log.message(`Send message init, params:\n${log.object(params)}`);

    if (contentType === 'text/plain') {
      await this.publishEvent({
        dialogId,
        event: {
          type: 'ContentEvent',
          contentType,
          message,
        },
      }, (error, response) => {
        if (error) {
          log.error('Error sending message: ', error);
          return;
        }

        log.message('Send message response: ', response);
      });
    }
  }

  init() {
    this.on('connected', (msg) => {
      console.log(msg);
      log.message(`Successfully connected agent with accountId: ${this.conf.accountId}`);

      // make the agent visibity to "online"
      this.setAgentState({ availability: 'ONLINE' });

      this.subscribeExConversations({
        agentIds: [this.agentId],
        convState: ['OPEN'],
      }, (error, response) => {
        if (error) {
          log.error(error);
          return;
        }

        log.message('subscribeExConversations ', this.conf.accountId || '', response);
      });

      this.subscribeRoutingTasks({});

      // keep alive connection strategy
      this.pingClock = setInterval(this.getClock, 30000);
    });

    // Notification on changes in the open consversation list
    this.on('cqm.ExConversationChangeNotification', (notificationBody) => {
      notificationBody.changes.forEach(async (change) => {
        const { convId } = change.result;

        const messageDetails = await extractMessageDetails(change);

        if (messageDetails.type === 'hosted/file') {
          const fileURL = await generateURLForDownloadFile(this, messageDetails.relativePath);
          await triggerWebhook('https://hooks.zapier.com/hooks/catch/1646904/7pk8w6/', { fileURL });
          log.success(`Successfully generated download file URL!\nConvId:   ${convId}\nURL:      ${fileURL}`);
        }

        if (change.type === 'UPSERT' && !this.openConversations[convId]) {
          // New conversation
          this.openConversations[convId] = {};

          const conversationDetails = extractConversationDetails(change);
          await triggerWebhook('https://hooks.zapier.com/hooks/catch/1646904/7pkzff/', conversationDetails);
          log.success(`Successfully retrieved recently created conversation details!\nConvId:   ${convId}`);

          this.consumerId = change.result.conversationDetails.participants.filter(p => p.role === 'CONSUMER')[0].id;
          this.getUserProfile(this.consumerId, (error, response) => {
            if (error) {
              log.error(error);
              return;
            }

            log.message(`New conversation!\n${log.object(response)}`);
          });

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
          log.message(`Unhandled event occured in conversation: ${convId}\n${log.object(change)}`);
        }
      });
    });

    this.on('error', (error) => {
      log.error('Error: ', error);
    });

    this.on('closed', (data) => {
      // For production environments ensure that you implement reconnect logic according to
      // liveperson's retry policy guidelines: https://developers.liveperson.com/guides-retry-policy.html
      log.error('Socket closed: ', data);
      clearInterval(this.pingClock);
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


// Accept any routingTask (==ring)
// this.on('routing.RoutingTaskNotification', (body) => {
//   body.changes.forEach((c) => {
//     if (c.type === 'UPSERT') {
//       c.result.ringsDetails.forEach((r) => {
//         if (r.ringState === 'WAITING') {
//           this.updateRingState({
//             ringId: r.ringId,
//             ringState: 'ACCEPTED',
//           }, (e, resp) => console.log(resp));
//         }
//       });
//     }
//   });
// });

*/
