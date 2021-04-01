const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// const logger = require('morgan');
const session = require('express-session');
const socket_io = require('socket.io');
const db = require('./lib/db');
const pgSession = require('connect-pg-simple')(session);

// router setup
const indexRouter = require('./routes/index');
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
  store: new pgSession({ pgPromise : db, tableName : 'session' }),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true, 
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 },
};
app.use(session(session_opt));
io.use((socket, next) => {
  session(session_opt)(socket.request, socket.request.res, next);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(logger('dev'));
app.use(express.json());
// app.use(express.text());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  initialize(req, res).then(next());
});
app.use('/', indexRouter);
app.use('/item', itemRouter);
app.use('/template', templateRouter);
app.use('/basket', basketRouter);
app.post('/emit', async (req, res) => {
  emit(req, res);
});
app.post('/chatLoad', async (req, res) => {
  chatLoad(req, res);
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

//-----------------------
// 関数定義
//-----------------------
const common = require('./lib/const.js'); // 共通定数ファイル
// ユーザーパラメーター設定
async function initialize(req, res) {
  const ss = req.session;
  // 訪問者の名前を勝手に決める
  if(!ss.name) {
    ss.name = common.nameAry[Math.floor(Math.random() * common.nameAry.length)] + '(仮)';
  }
  // アイコンも勝手に決める
  if(!ss.icon) {
    ss.icon = common.iconAry[~~(Math.random() * common.iconMax)];
  }
  // お金
  if(!ss.balance) {
    ss.balance = 55000;
  }
  // 買い物かご
  if(!ss.basket) {
    ss.basket = {};
  }
  // 買い物かごの中に個数が0のアイテムあればkeyごと削除 (買い物かご操作中はスルー)
  if(Object.values(ss.basket).includes(0) && (req.url !== '/basket/changeQty' || req.url !== '/basket/payment')) {
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
  } else {
    ss.itemQty = 0;
  }
  // 購入済アイテム
  if(!ss.repository) {
    ss.repository = {};
  }
  // 購入済アイテム
  if(!ss.review) {
    ss.review = {};
  }
  return Promise.resolve();
}

// チャット書き込み処理
async function emit(req, res) {
  const ss = req.session;
  const body = req.body;
  const maxCount = 20;
  // バリデーション
  if(!body.name.trim() || !body.msg.trim() || !(body.icon - 0 > 0) || !(body.icon - 0 <= common.iconMax)) {
    return res.end();
  }
  // DBへ書き込み
  ss.icon = body.icon;
  ss.name = body.name;
  const msg = body.msg;
  let qr = '';
  qr = 'INSERT INTO Chat(sid, chat_icon, chat_name, chat_msg, posted_at) VALUES($1, $2, $3, $4, DEFAULT)';
  await db.none(qr, [ss.id, ss.icon, ss.name, msg]);
  qr = 'SELECT COUNT(*) FROM Chat';
  const postedCount = (await db.one(qr))['count'] - 0;
  if(postedCount > maxCount) {
    qr ='DELETE FROM Chat WHERE posted_at IN (SELECT posted_at FROM Chat ORDER BY posted_at limit $1)';
    await db.none(qr, [postedCount - maxCount]);
  }
  // msgをサイト閲覧者全員に送信
    io.emit("s2c", { msg });
  // お金増やす
  const income = Math.round(Math.random () * 50000) + 10000;
  ss.balance += income;
  app.render('./partial/moko', { income }, (err, html) => {
    res.json({ ss, income, html });
  });
}

// chat一覧更新
async function chatLoad(req, res) {
  const ss = req.session;
  qr = 'SELECT * FROM Chat ORDER BY posted_at DESC';
  let chatLog = await db.any(qr);
  res.render('./partial/chatView', { chatLog, ss })
}


//-----------------------
// socket
//-----------------------

// welcome message
io.on("connection", async socket => {
  const ss = socket.request.session;
  const count = socket.client.conn.server.clientsCount;
  const date = new Date() ;
  const currentTime = date.getTime();
  let msg = '';
  if(!ss.lastTime) {
    msg = `ようそこ ${ss.name}さん、初めまして`;
  } else if(currentTime - ss.lastTime > 10 * 60 * 1000) {
    msg = `おかえりなさい${ss.name}さん`;
  }
  if(msg.length > 0) {
    io.emit("s2c", { msg });
    if(count > 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      io.emit("s2c", { msg: `現在${count}人閲覧中です` });
    }
  }
  ss.lastTime = currentTime;
  ss.save();
});




    // にしbot書き込み
    // let qr = 'INSERT INTO Chat(sid, chat_icon, chat_name, chat_msg, posted_at) VALUES($1, $2, $3, $4, DEFAULT)';
    // await db.none(qr, ['yn_nishi', '19', 'にしbot', msg]);

module.exports = app;
