var express = require('express');
var router = express.Router();
const db = require('../lib/db');
const common = require('../lib/const.js');


router.get ('/', async (req, res) => {
  const ss = req.session;
  let items = {};
  let qr = '';
  const itemIds = Object.keys(ss.repository);
  if(itemIds.length > 0) {
    qr = 'SELECT * FROM Items WHERE id IN ($1:csv)';
    items = await db.any(qr, [itemIds]);
  }
  qr = 'SELECT * FROM Chat ORDER BY posted_at DESC';
  const chatLog = await db.any(qr);
  res.render('index', { common, ss, chatLog, items });
});

module.exports = router;