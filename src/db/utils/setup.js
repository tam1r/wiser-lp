const tables = require('../tables');
const promisifyQuery = require('./promisifyQuery');

const { log } = require('../../utils');

async function setup(connection) {
  const DB_NAME = process.env.NODE_ENV === 'production' // create the database if it doesn't exists
    ? process.env.CLEARDB_DATABASE_NAME
    : process.env.DEV_DATABASE_NAME;

  try {
    await promisifyQuery(connection, `CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
  } catch (e) { console.error(e); }

  await promisifyQuery(connection, `USE ${DB_NAME}`);

  tables.forEach(async (table) => {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${table.name} (${table.fields})`; // create the tables if they don't exist
    await promisifyQuery(connection, createTableQuery);
  });

  log.info('Finished database setup successfully');
}

module.exports = setup;
