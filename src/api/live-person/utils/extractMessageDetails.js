const { log, addressToGeolocation } = require('../../../utils');

const latlngRegexp = /latitude:\s+?(-?\d+\.\d+)(?:\n+)?longitude:\s+?(-?\d+\.\d+)/gmi;
const addressRegexp = /Consumer shared a location:\n+?Address:(.*)/gmi;

function extractMessageDetails(change, signale) {
  return new Promise(async (resolve) => {
    const {
      convId,
      lastContentEventNotification: notification,
    } = change.result;

    if (notification) {
      const userId = notification.originatorPId || 'NOT_FOUND';
      const { contentType, message } = notification.event;

      if (contentType === 'text/plain') {
        signale.info(
          log.info('New text message!\n'),
          log.info(`\t\t\t\t\t\tConversation id: ${convId}\n`),
          log.info(`\t\t\t\t\t\tDialogId: ${notification.dialogId}\n`),
          log.info(`\t\t\t\t\t\tFrom userId: ${userId}\n`),
          log.info(`\t\t\t\t\t\tMessage: ${message}`),
        );

        const isMessageSharedLocation = latlngRegexp.test(message);
        const isMessageSharedAddress = addressRegexp.test(message);
        latlngRegexp.lastIndex = 0;
        addressRegexp.lastIndex = 0;

        if (isMessageSharedLocation) {
          const {
            1: latitude,
            2: longitude,
          } = latlngRegexp.exec(message);

          signale.debug(
            log.debug('Parsed shared lat/lng correctly!\n'),
            log.debug(`\t\t\t\t\tlatitude: ${latitude}\n`),
            log.debug(`\t\t\t\t\tlongitude: ${longitude})`),
          );

          resolve({
            type: contentType,
            location: {
              latitude,
              longitude,
            },
          });
          return;
        }

        if (isMessageSharedAddress) {
          const { 1: address } = addressRegexp.exec(message);

          signale.debug(
            log.debug('Parsed shared address correctly!\n'),
            log.debug(`\t\t\taddress: ${address}`),
          );

          try {
            const {
              lat: latitude,
              lng: longitude,
            } = await addressToGeolocation(address);

            signale.debug(
              log.debug('Converted shared address to lat/lng correctly!\n'),
              log.debug(`\t\t\tlatitude: ${latitude} | longitude: ${longitude}`),
            );

            resolve({
              type: contentType,
              location: {
                latitude,
                longitude,
              },
            });
            return;
          } catch (error) {
            signale.fatal(new Error(error));
          }
        }

        resolve({ type: contentType });
        return;
      }

      if (contentType === 'hosted/file') {
        const { relativePath } = message;

        signale.debug(
          log.info('New media message!\n'),
          log.info(`\t\t\tConversation id: ${convId}\n`),
          log.info(`\t\t\tDialogId: ${notification.dialogId}\n`),
          log.info(`\t\t\tFrom userId: ${userId}\n`),
          log.info(`\t\t\tRelative Path: ${relativePath}`),
        );

        resolve({
          type: contentType,
          relativePath,
        });
      }
    }
  });
}

module.exports = extractMessageDetails;
