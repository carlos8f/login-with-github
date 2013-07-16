var loginHandler = require('../')({
  client_id: 'your-client-id',
  client_secret: 'your-client-secret',
  login_path: '/login/github'
});

var server = require('http').createServer()
  , sess = require('sess')()

server.on('request', function (req, res) {
  // sess() provides req.session
  sess(req, res, function (err) {
    if (err) throw err;
    // handle logins
    loginHandler(req, res, function (err) {
      // if login errored
      if (err) throw err;
      // if login was successful
      if (req.github_user) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(req.github_user, null, 2));
        // also req.github_access_token available
      }
      // else no login attempted
      else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('<a href="/login/github">login with github</a>');
      }
    });
  });
});

server.listen(3000, function () {
  console.log('server started at http://localhost:3000/');
});
