require('dotenv').config();

const path = require('path');

const migrations = {
  directory: './migrations',
  tableName: 'knex_migrations',
};

const seeds = {
  directory: './seeds',
};

/** @type {import('knex').Knex.Config} */
module.exports = process.env.DATABASE_URL
  ? {
      client: 'pg',
      connection: process.env.DATABASE_URL,
      migrations,
      seeds,
    }
  : {
      client: 'better-sqlite3',
      connection: {
        filename: path.join(process.env.DATA_DIR || './data', 'neurotech_quit.sqlite'),
      },
      useNullAsDefault: true,
      migrations,
      seeds,
    };
