var express = require('express');
var router = express.Router();
const db = require('../lib/db');

router.post('/', async (req, res) => {
  const ss = req.session;
  ss.basket = {'1': 2, '2': 1, '3': 8};
  const itemIds = Object.keys(ss.basket);
  if(itemIds.length > 0) {
    let q = 'SELECT * FROM items WHERE id IN ($1:csv)';
    let itemsInfo = await db.any(q, [itemIds]);
    res.render('./partial/basketTable', { itemsInfo: itemsInfo, basket: ss.basket });

  } else {
    res.send('何も入っていません。');
  }
  
});

router.use('/changeQty', async (req, res) => {
  // express.text();
  console.log(req.body);
});

module.exports = router;