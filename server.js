var express       = require('express'),
    https         = require('https'),
    sessions      = require('client-sessions'),
    fonts         = require('connect-fonts'),
    font_opensans = require('connect-fonts-opensans'),
    font_alegreyasans
                  = require('connect-fonts-alegreyasans'),
    url           = require('url'),
    oauth         = require('./oauth'),
    config        = require('./config');
    db            = require('./db');

var app = express();

app.use(express.logger());
app.use(express.json());

//app.use(require('./retarget.js'));

var allowOrigin = "*";
try {
  // a bit of a dirty hack. Use the redirect_uri to find
  // out what this server's public host is.
  allowOrigin = url.parse(config.redirect_uri).host;
} catch(e) {
}

app.use(fonts.setup({
  allow_origin: allowOrigin,
  ua: "all",
  fonts: [ font_opensans, font_alegreyasans ]
}));

app.use(function (req, res, next) {
  if (/^\/api/.test(req.url)) {
    res.setHeader('Cache-Control', 'no-cache, max-age=0');

    return sessions({
      cookieName: '123done',
      secret: process.env['COOKIE_SECRET'] || 'define a real secret, please',
      requestKey: 'session',
      cookie: {
        path: '/api',
        httpOnly: true
      }
    })(req, res, next);
  } else {
    return next();
  }
});

app.use(
  require('express-able')({
    dir: './experiments',
    addRoutes: true,
    reportHandler: function (report, cb) {
      console.log(report)
      cb()
    }
  })
)

// add oauth endpoints
oauth(app, db);

// a function to verify that the current user is authenticated
function checkAuth(req, res, next) {
  if (!req.session.email) {
    res.send("authentication required\n", 401);
  } else {
    next();
  }
}

// auth status reports who the currently logged in user is on this
// session
app.get('/api/auth_status', function(req, res) {
  console.log(req.session);

  res.send(JSON.stringify({
    email: req.session.email || null,
  }));
});

// logout clears the current authenticated user
app.post('/api/logout', checkAuth, function(req, res) {
  req.session.reset();
  res.send(200);
});

// the 'todo/save' api saves a todo list
app.post('/api/todos/save', checkAuth, function(req, res) {
  db.set(req.session.token, req.body || []);
  res.send(200);
});

// the 'todo/get' api gets the current version of the todo list
// from the server
app.get('/api/todos/get', checkAuth, function(req, res) {
  db.get(req.session.token, function(err, reply) {
    if (err) {
      res.send(err.toString(), { 'Content-Type': 'text/plain' }, 500);
    } else {
      res.send(reply ? reply : '[]', { 'Content-Type': 'application/json' }, 200);
    }
  });
});

app.get(/^\/iframe(:?\/(?:index.html)?)?$/, function (req, res, next) {
  req.url = '/index.html';
  next();
});

app.use(express.static(__dirname + "/static"));
var port = process.env['PORT'] || config.port || 8080;
app.listen(port, '0.0.0.0');
console.log('123done started on port', port);
