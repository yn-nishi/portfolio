const initOptions = {
  // initialization options;
};
const pgp = require('pg-promise')(initOptions);
const connection = {
  host: '',
  port: 5432,
  database: 'api',
  user: '',
  password: ''
};
const db = pgp(connection);

// module.exports = pgp(connection);
module.exports = db;