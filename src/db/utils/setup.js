const tables = require('../tables');
const promisifyQuery = require('./promisifyQuery');

const { log } = require('../../utils');

async function setup(connection) {
  // create the database if it doesn't exists
  const DB_NAME = process.env.NODE_ENV === 'production'
    ? process.env.CLEARDB_DATABASE_NAME
    : process.env.DEV_DATABASE_NAME;

  await promisifyQuery(connection, `CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);

  // use the database
  await promisifyQuery(connection, `USE ${DB_NAME}`);

  // create the tables if they don't exist
  tables.forEach(async (table) => {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${table.name} (${table.fields})`;
    await promisifyQuery(connection, createTableQuery);
  });

  log.info('Finished database setup successfully');
}

module.exports = setup;
