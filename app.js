// dependency
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const pg = require('pg');
const twitter = require('twitter');
const url = require('url');

// path
const index = require('./routes/index');

// application
const app = express();

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

// middleware setup
// json parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
// static file to public
app.use(express.static(path.join(__dirname, 'public')));
// path
app.use('/', index);

// twitter setup
const twitterClient = new twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

// database settings
const params = url.parse(process.env.DATABASE_URL);
const auth = params.auth.split(':');
const config = {
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split('/')[1],
  ssl: true
};
const table = 'settings';
let pool = new pg.Pool(config);

// basic functions for database (CRUD)
const createDB = data => {
  console.log('creating new tuple by', data);
  return new Promise((resolve, reject) => {
    pool.connect((err, client, release) => {
      if (err) {
        console.error('connection error occurred in creating.');
        reject(err);
      }
      const query =
        'INSERT INTO ' + table + ' ' +
        'VALUES(DEFAULT, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ' +
        "'" + data.screenName + "', " + data.mention + ', ' + data.lastStatus +
        ", '" + data.createdAt + "', DEFAULT, DEFAULT);";
      console.log(query);
      client.query(query, (err, res) => {
        if (err) {
          console.error('process error occurred in read querying.');
          reject(err);
        } else {
          resolve(true);
        }
        client.end();
      });
    });
  });
};
const readDB = screenName => {
  console.log('reading ' + (screenName ? 'DB by ' + screenName + '.' :
    'the entire DB.'));
  return new Promise((resolve, reject) => {
    pool.connect((err, client, release) => {
      if (err) {
        console.error('connection error occurred in reading.');
        reject(err);
      }
      let query;
      if (screenName) {
        query =
          'SELECT * ' +
          'FROM ' + table + ' ' +
          "WHERE screen_name = '" + screenName + "' " +
          'LIMIT 1;';
      } else {
        query = 'SELECT * FROM ' + table + ' ORDER BY id ASC;';
      }
      console.log(query);
      client.query(query, (err, res) => {
        if (err) {
          console.error('process error occurred in read querying.');
          reject(err);
        } else {
          resolve(res);
        }
        client.end();
      });
    });
  });
};
const updateDB = data => {
  console.log('updating DB by', data);
  return new Promise((resolve, reject) => {
    pool.connect((err, client, release) => {
      if (err) {
        console.error('connection error occurred in updating.');
        reject(err);
      }
      const query =
        'UPDATE ' + table + ' ' +
        'SET updated_at = CURRENT_TIMESTAMP, ' +
        'last_status = ' + data.lastStatus + ', ' +
        'total_count = total_count + 1, ' +
        'this_year_count = this_year_count + 1 ' +
        "WHERE screen_name = '" + data.screenName + "';";
      console.log(query);
      client.query(query, (err, res) => {
        if (err) {
          console.error('process error occurred in update querying.');
          reject(err);
        } else {
          resolve(res);
        }
        client.end();
      });
    });
  });
};

// like tweet that has specified id
const like = idStr => {
  twitterClient.post('favorites/create', {id: idStr}, (err, data, res) => {
    if (err) {
      console.error('post error occurred in processing like.');
      console.error(err.stack);
      return false
    } else {
      console.log(data, res);
      return true
    }
  });
}

// mention with data
const mention = (tweet, data) => {
  const createdAt = new Date(tweet.created_at).getTime();
  const startedAt = new Date(data.started_at).getTime();
  const thisYear = new Date().getFullYear();
  const thisYearFirstDate = new Date(thisYear + '-01-01T00:00:00Z').getTime();
  const totalRatio = data.totalCount * 86400000 / (createdAt - startedAt);
  const thisYearRatio =
    data.thisYearCount * 86400000 / (createdAt - thisYearFirstDate);
  const text =
    'Total: ' + data.totalCount + '\n' +
    'In ' + thisYear + ': ' + data.thisYearCount + '\n' +
    'Total MPD: ' + totalRatio + '[mpd]\n' +
    'In ' + thisYear + ' MPD: ' + thisYearRatio + '[mpd]\n' +
    'Have a good Mazai!';
  console.log(text);
  twitterClient.post('statuses/update', {
    in_reply_to_status_id: tweet.id_str,
    status: '@' + tweet.user.screen_name + '\n' + text
  }, (err, data, res) => {
    if (err) {
      console.error('post error occurred in processing mention.');
      console.error(err.stack);
      return false
    }
    console.log(data, res);
    return true
  });
}

// search '#TodaysMazai' tweet and like/mention it
const search = () => {
  console.log('searching #TodaysMazai tweet.');
  const query = '#TodaysMazai exclude:retweets';
  const count = '4';
  twitterClient.get('search/tweets', {
    count: count,
    result_type: 'recent',
    q: query
  }, async (error, result, response) => {
    if (error) {
      console.error('get error occurred in processing search.');
      console.error(error.stack);
      return;
    }
    revStatuses = result.statuses.reverse();
    for (let tweet of revStatuses) {
      const statusID = tweet.id_str;
      const screenName = tweet.user.screen_name;
      let settings = await readDB(screenName);
      if (settings.rowCount === 0) {
        // new TodaysMazaist
        await createDB({
          createdAt: tweet.created_at,
          lastStatus: tweet.id_str,
          mention: false,
          screenName: screenName
        });
        settings = await readDB(screenName);
      }
      settings = settings.rows[0];
      if (settings.last_status < tweet.id_str) {
        if (screenName != '_Le96_') {
          like(tweet.id_str);
        }
        if (settings.mention) {
          mention(tweet, {
            started_at: settings.started_at,
            thisYearCount: settings.this_year_count + 1,
            totalCount: settings.total_count + 1
          });
        }
        await updateDB({
          lastStatus: tweet.id_str,
          screenName: screenName
        });
      }
    }
  });
}

// APIs
// search API
app.post('/search', (req, res) => {
  search();
  res.send(true);
});

// fetch API (in develop)
app.get('/fetch', async (req, res) => {
  res.send(await readDB(null));
});

// update API (deprecated)
app.post('/update', (req, res) => {
  const body = req.body;
  res.send(writeData(body.lfd, body.tfd, body.tc, body.tyc));
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// main
const sleep = () => {
  return new Promise(resolve => setTimeout(resolve, 8000));
};
const main = async () => {
  while (true) {
    pool = new pg.Pool(config);
    await search();
    await sleep();
  }
};
main();
