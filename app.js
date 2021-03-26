const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// const logger = require('morgan');
const session = require('express-session');
const socket_io = require('socket.io');
const db = require('./lib/db');

// router setup
const indexRouter = require('./routes/index');
const testRouter = require('./routes/test');
const templateRouter = require('./routes/template');
const itemRouter = require('./routes/item');
const basketRouter = require('./routes/basket');
const { IncomingMessage } = require('http');

const app = express();
// socket.io setup
const io = socket_io();
app.io = io;

// session setup
const session_opt = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true, 
  cookie: { maxAge: 60 * 60 * 1000 },
};
app.use(session(session_opt));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(logger('dev'));
app.use(express.json());
// app.use(express.text());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// ユーザーパラメーター設定
app.use((req, res, next) => {
  initialize(req, res).then(next());
});
app.use('/', indexRouter);
app.use('/item', itemRouter);
app.use('/test', testRouter);
app.use('/template', templateRouter);
app.use('/basket', basketRouter);
app.post('/emit', async (req, res) => {
  emit(req, res);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//-------------------//
//関数定義
//-------------------//
const iconMax = 26;
// ユーザーパラメーター設定
async function initialize(req, res) {
  const ss = req.session;
  // 訪問者の名前を勝手に決める
  if(!ss.name) {
    ss.name = nameAry[Math.floor(Math.random() * nameAry.length)] + '(仮)';
  }
  // アイコンも勝手に決める
  ss.iconArray = [];
  for(let i = 1; i <= iconMax; i++) {
    ss.iconArray.push(('00' + i).slice(-2)); // ['01', '02', ...'iconMax']
  }
  if(!ss.icon) {
    ss.icon = ss.iconArray[~~(Math.random() * iconMax)];
  }
  // お金
  if(!ss.balance) {
    ss.balance = 55000;
  }
  // 買い物かご初期化
  if(!ss.basket) {
    ss.basket = {};
    // console.log('basket', ss.basket);
    // ss.basket = {'1': 2, '2': 1, '3': 7}; //test
  }
  // 買い物かごの中に個数が0のアイテムあればkeyごと削除 (ユーザーが個数変更中はスルー)
  if(Object.values(ss.basket).includes(0) && req.url !== '/basket/changeQty') {
    for (const key in ss.basket) {
      if(ss.basket[key] === 0) delete ss.basket[key];
    }
  }
  // 買い物かごのアイテム個数計算
  if(!ss.itemQty) {
    ss.itemQty = 0;
  }
  if(Object.values(ss.basket).length > 0) {
    ss.itemQty = Object.values(ss.basket).reduce(function(a, x){ return a + x; })
  }
  return Promise.resolve();
}

// チャット書き込み処理
async function emit(req, res) {
  const ss = req.session;
  const body = req.body;
  // バリデーション
  if(!body.name.trim() || !body.msg.trim() || !(body.icon - 0 > 0) || !(body.icon - 0 <= iconMax)) {
    return res.end();
  }
  // 送信データ取得
  ss.icon = body.icon;
  ss.name = body.name;
  const msg = body.msg;
  // DB 入力
  let q = '';
  q = 'INSERT INTO Chat(sid, chat_icon, chat_name, chat_msg, posted_at) VALUES($1, $2, $3, $4, DEFAULT)';
  await db.none(q, [ss.id, ss.icon, ss.name, msg]);
  // {count: '記事数'} をDBから取得し数字に変換
  q = 'SELECT COUNT(*) FROM Chat';
  const postedCount = (await db.one(q))['count'] - 0;
  // 20件を超えた古いデータから削除
  if(postedCount > 20) {
    q ='DELETE FROM Chat WHERE posted_at IN (SELECT posted_at FROM Chat ORDER BY posted_at limit $1)';
    await db.none(q, [postedCount - 20]);
  }
  // 全チャットログを取得
  q = 'SELECT * FROM Chat ORDER BY posted_at DESC';
  let chatLog = await db.many(q);
  // チャットログを元にhtml生成しサイト閲覧者全員に送信
  app.render('./partial/chatView', { chatLog, ss }, (err, html) => {
    io.emit("s2c", html );
  });
  // お金増やす
  const income = Math.round(Math.random () * 50000) + 10000;
  ss.balance += income;
  app.render('./partial/moko', { income }, (err, html) => {
  res.json({ ss, income, html });
});


}

const nameAry = [
  '佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口',
  '斎藤', '松本', '井上', '木村', '林', '清水', '山崎', '森', '阿部', '池田', '橋本', '山下', '石川', '中島', '前田', '藤田',
  '小川', '後藤', '岡田', '長谷川', '村上', '近藤', '石井', '齊藤', '坂本', '遠藤', '青木', '藤井', '西村', '福田', '太田', '三浦',
  '岡本', '松田', '中川', '中野', '原田', '小野', '田村', '竹内', '金子', '和田', '中山', '藤原', '石田', '上田', '森田', '原',
  '柴田', '酒井', '工藤', '横山', '宮崎', '宮本', '内田', '高木', '安藤', '谷口', '大野', '丸山', '今井', '高田', '藤本', '武田',
  '村田', '上野', '杉山', '増田', '平野', '大塚', '千葉', '久保', '松井', '小島', '岩崎', '桜井', '野口', '松尾', '野村', '木下',
  '菊地', '佐野', '大西', '杉本', '新井', '浜田', '菅原', '市川', '水野', '小松', '島田', '古川', '小山', '高野', '西田', '菊池',
  '山内', '西川', '五十嵐', '北村', '安田', '中田', '川口', '平田', '川崎', '飯田', '吉川', '本田', '久保田', '沢田', '辻', '関',
  '吉村', '渡部', '岩田', '中西', '服部', '樋口', '福島', '川上', '永井', '松岡', '田口', '山中', '森本', '土屋', '矢野', '広瀬',
  '秋山', '石原', '松下', '大橋', '松浦', '吉岡', '小池', '馬場', '浅野', '荒木', '大久保', '野田', '小沢', '田辺', '川村', '星野',
  '黒田', '堀', '尾崎', '望月', '永田', '熊谷', '内藤', '松村', '西山', '大谷', '平井', '大島', '岩本', '片山', '本間', '早川',
  '横田', '岡崎', '荒井', '大石', '鎌田', '成田', '宮田', '小田', '石橋', '篠原', '須藤', '河野', '大沢', '小西', '南', '高山',
  '栗原', '伊東', '松原', '三宅', '福井', '大森', '奥村', '岡', '内山', '片岡','長田','北川','迫','柿本','安岡'
  ];

module.exports = app;
