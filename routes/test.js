const express = require('express');
const router = express.Router();
const Pool = require('pg').Pool

// postgreSQL setup
const pool = new Pool({
  user: '',
  host: '',
  database: 'api',
  password: '',
  port: 5432,
});

/* GET users listing. */
router.get('/', (req, res, next) => {


  // pool.query('SELECT * FROM users ORDER BY id ASC', (pgError, pgData) => {
  //   if (pgError) {
  //     throw pgError
  //   }
    res.render('test', {
      // title: pgData.rows[2].name + ' | ' + pgData.rows[2].email
      title: 'pgData.rows'
    });
  // });
});

router.post('/emit', (req, res, next) => {

  console.log(req.body);
})
module.exports = router;
