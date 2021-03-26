var express = require('express');
var router = express.Router();
const db = require('../lib/db');

router.get ('/', async (req, res) => {
  const ss = req.session;
  let q = '';
  q = 'SELECT * FROM Chat ORDER BY posted_at DESC';
  const chatLog = await db.many(q);
    res.render('template', { ss, chatLog });
});


module.exports = router;