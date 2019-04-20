const tables = require('../tables');
const promisifyQuery = require('./promisifyQuery');

const { log } = require('../../utils');

async function setup(connection) {
  // create the database if it doesn't exists
  await promisifyQuery(connection, 'CREATE DATABASE IF NOT EXISTS wiserlp');

  // use the database
  await promisifyQuery(connection, 'USE wiserlp');

  // create the tables if they don't exist
  tables.forEach(async (table) => {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${table.name} (${table.fields})`;
    await promisifyQuery(connection, createTableQuery);
  });

  log.info('Finished database setup successfully');
}

module.exports = setup;
