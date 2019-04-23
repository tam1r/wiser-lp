const axios = require('axios');
const { log } = require('../../../utils');

function triggerWebhook(url, body) {
  return axios.post(url, body)
    .then((response) => {
      log.success(`Successful webhook!\nURL:    ${url}\nBody:   ${log.object(body)}\nResponse:   ${log.object(response.data)}`);
      return response;
    }).catch((error) => {
      log.error(error);
      return error;
    });
}

module.exports = triggerWebhook;
