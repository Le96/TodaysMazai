// dependency
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var fs = require('fs');
var path = require('path');
var twitter = require('twitter');
var util = require('util');

// path
var index = require('./routes/index');
var preferences = './resources/preferences.json';

// application
var app = express();

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

// middleware setup
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

// twitter setting
var client = new twitter({
  consumer_key: process.env.TW_TM_CK,
  consumer_secret: process.env.TW_TM_CS,
  access_token_key: process.env.TW_TM_ATK,
  access_token_secret: process.env.TW_TM_ATS
});
var myScrName = '_Le96_';

// basic functions
var checkData = function(){
  try {
    fs.statSync(preferences);
    return true;
  } catch(err) {
    return false;
  }
}

var writeData = function(lastFoundDate, totalFirstDate, totalCount, thisYearCount){
  try {
    fs.writeFileSync(preferences, '{\n  ' +
      '"lastFoundDate": "' + lastFoundDate + '",\n  ' +
      '"totalFirstDate": "' + totalFirstDate + '",\n  ' +
      '"totalCount": ' + totalCount + ',\n  ' +
      '"thisYearCount": ' + thisYearCount + '\n}\n');
    return true;
  } catch(err) {
    return false;
  }
}

var deleteData = function(){
  try {
    fs.unlinkSync(preferences);
    return true;
  } catch(err) {
    return false;
  }
}

var readData = function(){
  var content = new String();
  if (checkData()) {
    content = JSON.parse(fs.readFileSync(preferences, 'utf8'));
  }
  return content;
}

var like = function(id_str){
  client.post('favorites/create', {id: id_str}, function(err, data, res){
    console.log(data);
  });
}

var mention = function(tweet, current){
  tweetDate = new Date(tweet.created_at).getTime();
  tfd = new Date(current.totalFirstDate).getTime();
  thisYear = new Date().getFullYear();
  thisYearFirstDate = new Date(thisYear + '-01-01T00:00:00.000Z').getTime();
  totalDays = (tweetDate - tfd) / (86400000.0);
  thisYearDays = (tweetDate - thisYearFirstDate) / (86400000.0);
  totalRatio = current.totalCount / totalDays;
  thisYearRatio = current.thisYearCount / thisYearDays;
  text = 'Total : ' + current.totalCount + '\n' +
  'In ' + thisYear + ' : ' + current.thisYearCount + '\n' +
  'Total MPD : ' + totalRatio + '[mpd]\n' +
  'In ' + thisYear + ' MPD : ' + thisYearRatio + '[mpd]\n' +
  'Have a good Mazai!';
  client.post('statuses/update', {
    in_reply_to_status_id: tweet.id_str,
    status: '@' + myScrName + '\n' + text
  }, function(err, data, res){
    console.log(data);
  });
  console.log(text);
}

var printTweet = function(tweet){
  console.log('from:' + tweet.user.screen_name);
  console.log(tweet.text);
  console.log('at:' + tweet.created_at);
}

var search = function(req, res){
  var query = '#TodaysMazai';
  var c = 10;
  var settings = readData();
  var finish = false;
  settings.lastFoundDate = new Date(settings.lastFoundDate);
  settings.totalFirstDate = new Date(settings.totalFirstDate);
  client.get('search/tweets', {
    count: c + '',
    result_type: 'recent',
    q: query
  }, function(error, result, response){
    result.statuses.reverse().forEach(function(tweet){
      if (settings.lastFoundDate.getTime() < new Date(tweet.created_at).getTime()){
        settings.lastFoundDate = new Date(tweet.created_at);
        if (tweet.user.screen_name != myScrName){
          like(tweet.id_str);
          console.log('liked:');
        } else {
          settings.totalCount++;
          settings.thisYearCount++;
          mention(tweet.id_str, settings);
          console.log('mentioned:');
        }
        printTweet(tweet);
      }
    });
    writeData(settings.lastFoundDate, settings.totalFirstDate, settings.totalCount, settings.thisYearCount);
  });
}

var fetch = function(){
  return readData();
}

var update = function(req){
  writeData(req.lastFoundDate, req.totalFirstDate, req.totalCount, req.thisYearCount);
}

// APIs
// search API
// search '#TodaysMazai' tweet and like/mention it.
app.post('/search', function(req, res){
  search();
});

// fetch API
// fetch preferences for edit.
app.get('/fetch', function(req, res){
  res = fetch();
})

// update API
// update preferences.
app.post('/update', function(req, res){
  update(req);
});


// run for debug
search();
