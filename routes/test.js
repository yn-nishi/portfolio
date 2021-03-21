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


  if(!req.session.name) {
    req.session.name = 'テスト太郎';
  }
    res.render('test', {
      // title: pgData.rows[2].name + ' | ' + pgData.rows[2].email
      title: 'pgData.rows',
      ss: req.session.id,
      sname: req.session.name
    });
  // });
});

router.use('/emit', (req, res, next) => {
  //write on DB

  // pool.query(`INSERT INTO Chat (sid, chat_name, chat_msg, posted_at) VALUES ($1, $2, $3, DEFAULT)`, [sid ](pgErr, pgRes) => {
  //   if (pgErr) {
  //     throw pgErr;
  //   }
  // });

  res.send({
    aaaaa: 'thanks!!!',
    sid: req.session.id,
    body: req.body
  });

  // next();

}, (req, res) => {
  // get from DB & emit to client
  pool.query('SELECT * FROM Chat', (pgErr, pgRes) => {
    if (pgErr) {
      throw pgErr;
    }
    console.log(pgRes.rows);
  });
  // res.render('test', {
  //   title: 'pgData.rows',
  //   ss: req.session.id,
  //   sname: req.session.name
  // });

  res.send({aaaaa:'thanks!!!', sid:req.session.id});

  // console.log(req.session.id, req.session.name);
  // console.log(req.body);
})
module.exports = router;
