var db            = require('./db'),
    express       = require('express'),
    https         = require('https'),
    JWTool        = require('fxa-jwtool'),
    sessions      = require('client-sessions'),
    fonts         = require('connect-fonts'),
    font_opensans = require('connect-fonts-opensans'),
    font_alegreyasans
                  = require('connect-fonts-alegreyasans'),
    url           = require('url'),
    config        = require('./config');

var app = express();

app.use(express.logger());
app.use(express.urlencoded());
app.use(express.json());

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

// a function to verify that the current user is authenticated
function checkAuth(req, res, next) {
  if (!req.session.email) {
    res.send("authentication required\n", 401);
  } else {
    next();
  }
}

var jwtool = new JWTool([config.auth_jku])

app.post('/api/auth', function (req, res) {
  // Verify the idtoken's (JWT) signature with the key set from the configured JKU.
  // (Google's jwt include a `kid` but no `jku`)
  jwtool.verify(req.body.idtoken, { jku: config.auth_jku })
    .then(
      function (data) {
        // ensure the token meets all of our criteria
        if (
          data.aud === config.client_id
          && data.exp > (Date.now() / 1000)
          && data.hd === 'mozilla.com'
        ) {
          // set a cookie for authenticating against our other endpoints
          req.session.email = data.email
          res.send(data)
        }
        else {
          // this user is not authorized
          res.send(401)
        }
      },
      function (err) {
        // the token was not valid
        res.send(500, err)
      }
    )
})

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
  db.set(req.session.email, JSON.stringify(req.body));
  res.send(200);
});

// the 'todo/get' api gets the current version of the todo list
// from the server
app.get('/api/todos/get', checkAuth, function(req, res) {
  db.get(req.session.email, function(err, reply) {
    if (err) {
      res.send(err.toString(), { 'Content-Type': 'text/plain' }, 500);
    } else {
      res.send(reply ? reply : '[]', { 'Content-Type': 'application/json' }, 200);
    }
  });
});

app.get('/config', function (req, res) {
  res.type('application/javascript')
  res.send('var client_id = "' + config.client_id + '"')
});

app.use(express.static(__dirname + "/static"));
var port = process.env['PORT'] || config.port || 8080;
app.listen(port, '0.0.0.0');
console.log('123done started on port', port);
