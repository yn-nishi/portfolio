var express = require('express');
var router = express.Router();
const Pool = require('pg').Pool

// postgreSQL setup
const pool = new Pool({
  user: '',
  host: '',
  database: 'api',
  password: '',
  port: 5432,
})


/* GET home page. */
router.get('/', function(req, res, next) {
  var session = req.session;

  if (!!session.visitCount) {
    session.visitCount += 1;
  } else {
    session.visitCount = 1;
  }
  session.msg = `こんちは、${session.visitCount}回目の訪問だよ<br>おあなたのID${session.id}`;
  console.log(req.session);
  res.render('index', {
    title: 'Express!!',
    visitCount: session.visitCount,
    msg: session.msg
  });
  
});

router.get('/aaa', function(req, res, next) {
  pool.query('SELECT * FROM users ORDER BY id ASC', (pgError, pgData) => {
    if (pgError) {
      throw pgError
    }
    res.render('index', {
      title: 'Express!!',
      visitCount: 'session.visitCount',
      msg: pgData.rows[2].name + ' | ' + pgData.rows[2].email
    });
  });
});
module.exports = router;
