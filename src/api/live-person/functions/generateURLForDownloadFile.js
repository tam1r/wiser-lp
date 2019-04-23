function generateURLForDownloadFile(agent, relativePath) {
  return new Promise((resolve, reject) => {
    agent.generateURLForDownloadFile({ relativePath }, (error, response) => {
      if (error) {
        reject(error);
      }

      const { temp_url_sig: tmpUrlSig, temp_url_expires: tmpUrlExp } = response.queryParams;

      const fileURL = `${relativePath}?temp_url_sig=${tmpUrlSig}&temp_url_expires=${tmpUrlExp}`;

      resolve(fileURL);
    });
  });
}

module.exports = generateURLForDownloadFile;
