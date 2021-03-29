var express = require('express');
var router = express.Router();
const db = require('../lib/db');

// app.render setup
const path = require('path');
const app = express();
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// 買い物かごの中身表示処理
router.post('/show', async (req, res) => {
  const ss = req.session;
  setItemQty(ss);
  const basketTableHtml = await makeBasketTable(ss);
  res.json({ html: basketTableHtml, ss });
});

// 買い物かごに追加処理
router.post('/add', async (req, res) => {
  const ss = req.session;
  const id = req.body.id;
  if(!ss.basket[id]) {
    ss.basket[id] = 1;
  }
  res.end();
});

// 買い物かごのアイテム個数操作
router.post('/changeQty', async (req, res) => {
  const ss = req.session;
  const mathType = req.body.mathType;
  const id = req.body.id;
  if(mathType === 'plus'&& ss.basket[id] > 0) {
    ++ss.basket[id];
  } else if(mathType === 'minus' && ss.basket[id] > 0) {
    --ss.basket[id];
    // 個数が0になったアイテムはapp.jsでkeyごと削除される
  }
  setItemQty(ss);
  const basketTableHtml = await makeBasketTable(ss);
  res.json({ html: basketTableHtml, ss });
});

// 購入処理
router.post('/payment', async (req, res) => {
  const ss = req.session;
  let qr = '';
  let total = 0;
  const itemIds = Object.keys(ss.basket);
  // 購入金額計算
  if(itemIds.length > 0) {
    qr = 'SELECT * FROM Items WHERE id IN ($1:csv)';
    let itemsInfo = await db.any(qr, [itemIds]);
    for(let item of itemsInfo) {
      total += item.price * ss.basket[item.id];
    }
  }
  if(total > ss.balance || total === 0) return res.end();
  // 初購入
  if(Object.keys(ss.repository).length === 0) {
    qr = `INSERT INTO Receipt (sid, purchased_items, reviews) VALUES ($1, $2, $3)`;
    ss.repository = ss.basket;
    await db.none(qr, [ss.id, ss.repository, ss.review]);
  // リピーター
  } else if(Object.keys(ss.repository).length > 0) {
    for(const id in ss.basket) {
      if(ss.repository[id] === undefined) {
        ss.repository[id] = ss.basket[id];
      } else {
        ss.repository[id] += ss.basket[id];
      }
    }
    // なんらかの理由でDB側のデータが消えてしまった時のためにINSERTも記述
    qr = 'SELECT * FROM Receipt WHERE sid = $1';
    let data = await db.oneOrNone(qr, [ss.id]);
    if(data === null) {
      qr = `INSERT INTO Receipt (sid, purchased_items, reviews) VALUES ($1, $2, $3)`;
      await db.none(qr, [ss.id, ss.repository, ss.review]);
    } else {
      qr = 'UPDATE Receipt SET purchased_items = $1 WHERE sid = $2';
      await db.none(qr, [ss.repository, ss.id]);
    }
  }
  ss.basket = {};
  ss.balance -= total;
  ss.itemQty = 0;
  app.render('./partial/basketPayment', {}, (err, html) => {
    res.json({ html, ss });
  });
});

// 買い物かごhtml生成
async function makeBasketTable(ss) {
  const itemIds = Object.keys(ss.basket);
  let itemsInfo = [];
  let total = 0;
  if(itemIds.length > 0) {
    let q = 'SELECT * FROM Items WHERE id IN ($1:csv)';
    itemsInfo = await db.any(q, [itemIds]);
    for(let item of itemsInfo) {
      total += item.price * ss.basket[item.id];
    }
  }
  let basketTableHtml = '';
  app.render('./partial/basketTable', { itemsInfo, ss, total },(err, html) => {
    basketTableHtml = html;
  });
  return basketTableHtml;
}
  // アイテム個数再計算
function setItemQty(ss) {
  if(Object.values(ss.basket).length > 0) {
    ss.itemQty = Object.values(ss.basket).reduce(function(a, x){ return a + x; })
  } else {
    ss.itemQty = 0;
  }
}


// SQL実験場
(async function() { 
// let qr = 'SELECT purchased_items FROM Clients WHERE sid = $1';
// is_purchased = true or false
// qr = `(SELECT purchased_items ? '6' as is_purchased FROM Clients WHERE sid = 'aaa')`; // のちほど aaa を ss.id へ

// qr = `(SELECT purchased_items FROM Clients WHERE sid = 'aaa')`; 
// let data = await db.oneOrNone(qr);
// console.log( data );
// console.log( toString.call (data[0]['purchased_items']) );
})();

module.exports = router;