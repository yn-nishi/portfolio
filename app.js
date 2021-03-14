const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const socket_io = require('socket.io');
// const SocketFuncs = require('./public/javascripts/SocketFuncs');
// const Pool = require('pg').Pool;

// const pool = new Pool({
//   user: '',
//   host: '',
//   database: 'api',
//   password: '',
//   port: 5432,
// });


const indexRouter = require('./routes/index');
const testRouter = require('./routes/test');
const templateRouter = require('./routes/template');

const app = express();
const io = socket_io();
// const sf = new SocketFuncs();
// for exports to bin/www
app.io = io;



// session setup
const session_opt = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false, 
  cookie: { maxAge: 60 * 60 * 1000 },
};
app.use(session(session_opt));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/test', testRouter);
app.use('/template', templateRouter);

io.on('connection', (socket) => {
  // sf.cl();
  console.log('★ a user connected ★');
  socket.on('disconnect', () => {
    console.log('■ user disconnected ■');
  });
  socket.on('c2s', (arg) => { 
    io.emit("s2c", arg);
    
    // pool.query('SELECT * FROM users ORDER BY id ASC', (pgError, pgData) => {
    //   if (pgError) {
    //     throw pgError
    //   }
    //   console.log(pgData.rows);
    // });
    // pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', ['myname', 'myemail'], (error, results) => {
    //   if (error) {
    //     throw error
    //   }
    // })
  });
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

module.exports = app;
