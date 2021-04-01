const initOptions = {
  // initialization options;
};
const pgp = require('pg-promise')(initOptions);
const connection = {
  // connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }
  host: '',
  port: 5432,
  database: 'api',
  user: '',
  password: ''
};
const db = pgp(connection);
module.exports = db;