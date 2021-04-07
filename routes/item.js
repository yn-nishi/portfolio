var express = require('express');
var router = express.Router();
const db = require('../lib/db');
const common = require('../lib/const.js');

router.get('/', function(req, res) {
  const ss = req.session;
  res.render('item', {
    ss: ss,
    item: {}
  });
});

router.get('/:param', async (req, res) => {
  const ss = req.session;
  const param = req.params.param;
  let qr = '';
  if(isNaN(param)) {
    const category = param;
    ss.path = [{ '/':'トップ' }, { here: common.e2j[category] }]
    qr = 'SELECT * FROM Items WHERE category = $1 ORDER BY id';
    let items;
    try {
      items = await db.many(qr, [category]);
    } catch(e) {
      res.status(404).send('Sorry cant find that!');
    }
    for(let i = 0; i < items.length; ++i) {
      items[i]['price'] = items[i]['price'].toLocaleString();
      items[i]['starHtml'] = generateStarHtml(items[i].reputation);
      items[i]['idStr'] = ('00' + items[i]['id']).slice(-2);
      items[i]['isPurchased'] =  items[i]['id'] in ss.repository;
    }
    res.render('itemView', { common, ss, items });
  } else {
    const id = param;
    const isPurchased =  id in ss.repository;
    qr = 'SELECT * FROM Items WHERE id = $1';
    let item;
    try {
      item = await db.one(qr, [id]);
    } catch(e) {
      res.status(404).send('Sorry cant find that!');
    }
    item.previous = await db.oneOrNone(qr, [id - 1]);
    item.next = await db.oneOrNone(qr, [id - 0 + 1]);
    item.idStr = ('00' + item.id).slice(-2);
    item.price = item.price.toLocaleString();
    item.starHtml = generateStarHtml(item.reputation);
    item.myStarHtml = generateMyStarHtml(id, ss.review[id]);
    ss.path = [{ '/':'トップ' }, { [item.category]: common.e2j[item.category] }, { here: item.title }];
    res.render('item', { common, ss, item, isPurchased });
  }
});

// 評価受信・反映
router.post('/appraise', async (req, res) => {
  const ss = req.session;
  const id = Object.keys(req.body)[0];
  const review = req.body[id];
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
