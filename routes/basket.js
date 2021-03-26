var express = require('express');
var router = express.Router();
const db = require('../lib/db');


// app.render用 setup
const path = require('path');
const app = express();
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// 買い物かごの中身を表示
router.post('/show', async (req, res) => {
  const ss = req.session;
  setItemQty(ss);
  const basketTableHtml = await makeBasketTable(ss);
  res.json({ html: basketTableHtml, ss });
});

// 買い物かごになければ追加
router.post('/add', async (req, res) => {
  const ss = req.session;
  const id = req.body.id;
  if(!ss.basket[id]) {
    ss.basket[id] = 1;
  }
  res.end();
});

// 買い物かごのアイテム個数増減
router.post('/changeQty', async (req, res) => {
  const ss = req.session;
  const mathType = req.body.mathType;
  const id = req.body.id;
  if(mathType === 'plus'&& ss.basket[id] > 0) {
    ++ss.basket[id];
  } else if(mathType === 'minus' && ss.basket[id] > 0) {
    --ss.basket[id];
    // 個数が0になったアイテムはapp.jsでkeyごと削除する
  }
  setItemQty(ss);
  const basketTableHtml = await makeBasketTable(ss);
  res.json({ html: basketTableHtml, ss });
});


router.post('/payment', async (req, res) => {
  const ss = req.session;
  q = `(SELECT purchased_items FROM Clients WHERE sid = 'aaa')`; 
  let data = await db.oneOrNone(q);
  let purchasedItems = data['purchased_items'];
  // console.log(purchasedItems);
  purchasedItems['9'] = 0;
  // console.log(!!purchasedItems['9']);
  //  q = `UPDATE Clients SET purchased_items = $1 WHERE sid = 'aaa'`; 
  // await db.none(q, [purchasedItems]);


res.end();

});

// 買い物かごhtml生成
async function makeBasketTable(ss) {
  // 買い物かごの中身のアイテムIDを使ってDB問い合わせ
  const itemIds = Object.keys(ss.basket);
  let itemsInfo = [];
  let total = 0;
  if(itemIds.length > 0) {
    let q = 'SELECT * FROM Items WHERE id IN ($1:csv)';
    itemsInfo = await db.any(q, [itemIds]);
    // かごの中の合計金額算出
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