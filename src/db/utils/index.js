const setup = require('./setup');
const connect = require('./connect');
const promisifyQuery = require('./promisifyQuery');
const addClient = require('./addClient');
const removeClient = require('./removeClient');
const handleDisconnect = require('./handleDisconnect');
const keepAlive = require('./keepAlive');
const getClient = require('./getClient');

module.exports = {
  setup,
  connect,
  promisifyQuery,
  addClient,
  removeClient,
  handleDisconnect,
  keepAlive,
  getClient,
};
