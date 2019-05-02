const WiserAgent = require('../../api/live-person/WiserAgent');

const livePersonServiceInit = async credentials => new WiserAgent(credentials);

module.exports = livePersonServiceInit;
