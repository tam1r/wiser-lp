const moment = require('moment');

function generateURLForDownloadFile(agent, relativePath) {
  return new Promise((resolve, reject) => {
    agent.generateURLForDownloadFile({ relativePath }, (error, response) => {
      if (error) {
        reject(error);
      }

      console.log('generate URL for download response: ', response);

      if (typeof response === 'object') {
        const { temp_url_sig: tmpUrlSig } = response.queryParams;

        const today = moment();
        const tomorrow = moment(today).add(1, 'days');

        const fileURL = `https://z2.objectstorage.liveperson.net${relativePath}?temp_url_sig=${tmpUrlSig}&temp_url_expires=${tomorrow.valueOf()}`;

        resolve(fileURL);
      } else {
        resolve(response);
      }
    });
  });
}

module.exports = generateURLForDownloadFile;
