// dependency
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var fs = require('fs');
var logger = require('morgan');
var path = require('path');
var twitter = require('twitter');
var util = require('util');

// path
var index = require('./routes/index');
var users = require('./routes/users');
var preferences = './resources/preferences.json';

// application
var app = express();

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

// middleware setup
// logger
app.use(logger('dev'));
// json parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
// cookie parser
app.use(cookieParser());
// static file to public
app.use(express.static(path.join(__dirname, 'public')));
// path
app.use('/', index);
app.use('/users', users);

// twitter setting
var client = new twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});
var myScrName = '_Le96_';

// basic functions
// check existence of preference file
var checkData = function() {
  try {
    fs.statSync(preferences);
    return true;
  } catch(err) {
    return false;
  }
}

// overwrite preference file
var writeData = function(lastFoundDate, totalFirstDate, totalCount, thisYearCount) {
  var lfd = new Date(lastFoundDate).toISOString();
  var tfd = new Date(totalFirstDate).toISOString();
  var tc = parseInt(totalCount);
  var tyc = parseInt(thisYearCount);
  if (lfd && tfd && tc && tyc) {
    try {
      fs.writeFileSync(preferences, '{\n  ' +
        '"lastFoundDate": "' + lfd + '",\n  ' +
        '"totalFirstDate": "' + tfd + '",\n  ' +
        '"totalCount": ' + tc + ',\n  ' +
        '"thisYearCount": ' + tyc + '\n}\n');
      return true;
    } catch(err) {
      return false;
    }
  } else {
    return false;
  }
}

// read preference file
var readData = function() {
  var content = new String();
  if (checkData()) {
    content = JSON.parse(fs.readFileSync(preferences, 'utf8'));
  }
  return content;
}

// like tweet that has specified id
var like = function(id_str) {
  client.post('favorites/create', {id: id_str}, function(err, data, res) {
    console.log(data);
  });
}

// mention me some data
var mention = function(tweet, lfd, tfd_, tc, tyc) {
  var tweetDate = new Date(tweet.created_at).getTime();
  var tfd = new Date(tfd_).getTime();
  var thisYear = new Date().getFullYear();
  var thisYearFirstDate = new Date(thisYear + '-01-01T00:00:00.000Z').getTime();
  var totalDays = (tweetDate - tfd) / (86400000.0);
  var thisYearDays = (tweetDate - thisYearFirstDate) / (86400000.0);
  var totalRatio = tc / totalDays;
  var thisYearRatio = tyc / thisYearDays;
  var text = 'Total : ' + tc + '\n' +
  'In ' + thisYear + ' : ' + tyc + '\n' +
  'Total MPD : ' + totalRatio + '[mpd]\n' +
  'In ' + thisYear + ' MPD : ' + thisYearRatio + '[mpd]\n' +
  'Have a good Mazai!';
  client.post('statuses/update', {
    in_reply_to_status_id: tweet.id_str,
    status: '@' + myScrName + '\n' + text
  }, function(err, data, res) {
    console.log(data);
  });
}

// search '#TodaysMazai' tweet and like/mention it
var search = function(req, res) {
  var query = '#TodaysMazai';
  var c = 10;
  var settings = readData();
  var finish = false;
  var lfd = new Date(settings.lastFoundDate);
  var tfd = new Date(settings.totalFirstDate);
  var tc = parseInt(settings.totalCount);
  var tyc = parseInt(settings.thisYearCount);
  client.get('search/tweets', {
    count: c + '',
    result_type: 'recent',
    q: query
  }, function(error, result, response) {
    result.statuses.reverse().forEach(function(tweet) {
      var tweetDate = new Date(tweet.created_at);
      if (lfd.getTime() < tweetDate.getTime()) {
        lfd = tweetDate;
        if (tweet.user.screen_name != myScrName) {
          like(tweet.id_str);
          console.log('liked:');
        } else {
          tc++;
          tyc++;
          mention(tweet, lfd, tfd, tc, tyc);
          console.log('mentioned:');
        }
        // print tweet
        console.log('from:' + tweet.user.screen_name);
        console.log(tweet.text);
        console.log('at:' + tweet.created_at);
      }
    });
    writeData(lfd, tfd, tc, tyc);
  });
}

// APIs
// search API
app.post('/search', function(req, res) {
  search();
  res.send(true);
});

// fetch API
app.get('/fetch', function(req, res) {
  res.send(readData());
});

// update API
app.post('/update', function(req, res) {
  var body = req.body;
  res.send(writeData(body.lfd, body.tfd, body.tc, body.tyc));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
