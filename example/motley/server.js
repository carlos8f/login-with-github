var app = require('motley');

app.boot(function (err) {
  if (err) throw err;
  app.motley();

  // here's where we pass options
  var loginHandler = require('../..')(app.conf);

  app.router
    .get('/', app.dish('<a href="/login/github">login with github</a>', {headers: {'Content-Type': 'text/html'}}))
    .get('/login/github', loginHandler, function (req, res, next) {
      res.json(req.github_user);
      // also req.github_access_token available
    })
    .on('error', function (err, req, res) {
      res.json(500, err);
    })

  app.server.listen(app.conf.port, function () {
    console.log('server started at http://localhost:' + app.server.address().port + '/');
  });
});
