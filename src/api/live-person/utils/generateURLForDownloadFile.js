const moment = require('moment');

function generateURLForDownloadFile(agent, relativePath) {
  return new Promise((resolve, reject) => {
    agent.generateURLForDownloadFile({ relativePath }, (error, response) => {
      if (error) {
        reject(error);
      }

      if (typeof response === 'object') {
        const { temp_url_sig: tmpUrlSig, temp_url_expires: tmpUrlExp } = response.queryParams;

        const today = moment();
        const tomorrow = moment(today).add(1, 'days'); // eslint-disable-line

        const fileURL = `https://z2.objectstorage.liveperson.net${relativePath}?temp_url_sig=${tmpUrlSig}&temp_url_expires=${tmpUrlExp}`;

        resolve(fileURL);
      } else {
        resolve(response);
      }
    });
  });
}

module.exports = generateURLForDownloadFile;
