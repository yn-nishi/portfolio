var express = require('express');
var router = express.Router();
const db = require('../lib/db');

router.get('/', function(req, res, next) {
  const ss = req.session;
  res.render('item', {
    myName: ss.myName,
    myIcon: ss.myIcon,
    item: {}
  });
  
});

router.get('/:id', async (req, res, next) => {
  const ss = req.session;
  const id = req.params.id;
  let q = '';
  // 購入済みかを調べる
  q = `(SELECT purchased_ids @> '${id}' FROM Client WHERE sid = 'aaaa')`; // のちほど aaa を ss.myId へ
  const isPurchased = await db.oneOrNone(q);
  // 未購入の場合
  if(isPurchased === null) {
    q = 'SELECT * FROM Items WHERE id = $1';
    const item = await db.one(q, [id]);
    // 0詰め数字
    item.id = ('00' + item.id).slice(-2);
    // 3桁カンマ区切り
    item.price = item.price.toLocaleString();
    //評価星の数計算
    item.reputation = 2.7;
    const roundDouble = Math.round(item.reputation * 2);
    item.fullStarCount = Math.floor(roundDouble / 2);
    item.halfStarCount = Math.round((roundDouble - item.fullStarCount * 2));
    item.borderStarCount = 5 - item.fullStarCount - item.halfStarCount;
    res.render('item', {
      myName: ss.myName,
      myIcon: ss.myIcon,
      item: item
    });
  // 購入済みの場合
  } else {
    res.render('item', {
      myName: 'purchased = true',
      myIcon: ss.myIcon,
      item: {}
    });
  }
});

module.exports = router;
