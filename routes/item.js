var express = require('express');
var router = express.Router();
const db = require('../lib/db');

router.get('/', function(req, res) {
  const ss = req.session;
  res.render('item', {
    ss: ss,
    item: {}
  });
});


// カテゴリー別商品一覧
router.get('/view/:category', async (req, res) => {
  const ss = req.session;
  const category = req.params.category;
  let qr = '';
  qr = 'SELECT * FROM Items WHERE category = $1';
  const items = await db.any(qr, ['app']);
  for(let i = 0; i < items.length; ++i) {
    items[i]['description'] = truncateString(items[i]['description'], 50)
    items[i]['price'] = items[i]['price'].toLocaleString();
    items[i]['starHtml'] = generateStarHtml(items[i].reputation);
  }
  res.render('itemView', { items, ss });
});


// 商品詳細ページ
router.get('/:id', async (req, res) => {
  const ss = req.session;
  const id = req.params.id;
  let qr = '';
  const isPurchased =  id in ss.repository;
  qr = 'SELECT * FROM Items WHERE id = $1';
  const item = await db.one(qr, [id]);
  item.id = ('00' + item.id).slice(-2);
  item.price = item.price.toLocaleString();
  item.starHtml = generateStarHtml(item.reputation);
  item.myStarHtml = generateMyStarHtml(id, ss.review[id]);
  res.render('item', { ss, item, isPurchased });
});


// 評価受信・反映
router.post('/appraise', async (req, res) => {
  const ss = req.session;
  const id = Object.keys(req.body)[0];
  const review = req.body[id];
  console.log(id, review);
  let qr = '';
  qr = 'SELECT * FROM Receipt WHERE sid = $1';
  let data = await db.oneOrNone(qr, [ss.id]);
  if(data === null || data.purchased_items[id] === undefined) {
    return res.sendStatus(403);
  }
  ss.review[id] = review;
  qr = 'UPDATE Receipt SET reviews = $1 WHERE sid = $2';
  await db.none(qr, [ss.review, ss.id]);
  qr = 'SELECT reviews FROM Receipt WHERE reviews ? $1';
  data = await db.any(qr, [id]);
  let reputation = 0, rep_amount = 0, rep_count = 0;
  for(let row of data) {
    rep_amount += row.reviews[id];
    ++rep_count;
  }
  reputation = Math.round(rep_amount / rep_count * 10) / 10;
  qr = 'UPDATE Items SET reputation = $1, rep_amount = $2, rep_count = $3 WHERE id = $4';
  await db.none(qr, [reputation, rep_amount, rep_count, id]);
  const starHtml = generateStarHtml(reputation);
  const myStarHtml = generateMyStarHtml(id, ss.review[id]);
  res.json({ reputation, rep_count, starHtml, myStarHtml })
});

// 文字切り捨て
function truncateString(str, num) {
  if (str.length <= num) {
    return str;
  } else {
    return str.slice(0, num > 3 ? num - 3 : num) + '...';
  }
}

// みんなの評価の星html
function generateStarHtml(reputation) {
  const double = Math.round(reputation * 2);
  const fullStarCount = Math.floor(double / 2);
  const halfStarCount = Math.round((double - fullStarCount * 2));
  const borderStarCount = 5 - fullStarCount - halfStarCount;
  const $fullStar = '<svg class="hp_icon_ss"><use xlink:href="/images/statics/stars.svg#full"></svg>';
  const $halfStar = '<svg class="hp_icon_ss"><use xlink:href="/images/statics/stars.svg#half"></svg>';
  const $borderStar = '<svg class="hp_icon_ss"><use xlink:href="/images/statics/stars.svg#border"></svg>';
  return $fullStar.repeat(fullStarCount) + $halfStar.repeat(halfStarCount) + $borderStar.repeat(borderStarCount);
}

// 自分の評価の星html
function generateMyStarHtml(id, reputation = 0) {
  const fullStarCount = reputation;
  const borderStarCount = 5 - reputation;
  let $fullStar = '';
  let $borderStar = '';
  let review = 1;
  for (let i = 0; i < fullStarCount; ++i) {
    $fullStar += `<svg class="hp_icon_ss" onclick="appraise({${id}:${review}})"><use xlink:href="/images/statics/stars.svg#full"></svg>`;
    ++review;
  }
  for (let i = 0; i < borderStarCount; ++i) {
    $borderStar += `<svg class="hp_icon_ss" onclick="appraise({${id}:${review}})"><use xlink:href="/images/statics/stars.svg#border"></svg>`;
    ++review;
  }
  return $fullStar + $borderStar;
}

module.exports = router;
