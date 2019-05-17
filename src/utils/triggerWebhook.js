const axios = require('axios');
const log = require('./log');

function triggerWebhook(url, body) {
  if (process.env.NODE_ENV === 'production') {
    return axios.post(url, body)
      .then((response) => {
        log.success(`Successful webhook!\nURL:    ${url}\nBody:   ${log.object(body)}\nResponse:   ${log.object(response.data)}`);
        return response;
      }).catch((error) => {
        log.error(error);
        return error;
      });
  }

  return null;
}

module.exports = triggerWebhook;
