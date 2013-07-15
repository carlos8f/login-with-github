var middler = require('middler')
  , request = require('request')
  , qs = require('querystring')
  , href = require('href')
  , idgen = require('idgen')

module.exports = function (_opts) {
  var options = {};
  Object.keys(_opts || {}).forEach(function (k) {
    options[k] = _opts[k];
  });

  // required options
  options.client_id || throw new Error('options.client_id requried');
  options.client_secret || throw new Error('options.client_secret required');

  // this is the path we'll mount handlers on
  options.loginPath || (options.path = '/login/github');

  // github api endpoints
  options.authorizeUrl || (options.authorizePath = 'https://github.com/login/oauth/authorize');
  options.accessTokenUrl || (options.accessTokenPath = 'https://github.com/login/oauth/access_token');
  options.userUrl || (options.userPath = 'https://api.github.com/user');

  // default callbacks
  options.onError || (options.onError = function (err, req, res, next) {
    next(err);
  });
  options.onSuccess || (options.onSuccess = function (access_token, user, req, res, next) {
    req.github_user = user;
    req.github_access_token = access_token;
    next();
  });

  var controller = middler();

  controller
    .first(function (req, res, next) {
      if (!req.session) return next(new Error('login-with-github requires req.session'));
      next();
    })
    .first(href)
    .first(function (req, res, next) {
      if (!req.query) {
        try {
          req.query = qs.parse(req.href.query);
        }
        catch (e) {
          return next(e);
        }
      }
      next();
    })
    .get(options.loginPath, function (req, res, next) {
      if (req.query.code) processCode(req, res, next);
      else if (req.query.error) processError(req, res, next);
      else doRedirect(req, res, next);
    })
    .add(function (req, res, next) {
      // continue to parent middleware chain
      next();
    })

  function processCode (req, res, next) {
    if (!req.session.github_login_state) return next(new Error('unknown login state'));
    if (!req.query.state) return next(new Error('state param required'));
    if (req.session.github_login_state !== req.query.state) return next(new Error('incorrect login state'));

    req.session.github_login_state = null;
    var uri = options.accessTokenPath + '?';
    var params = {
      client_id: app.conf.github_client_id,
      redirect_uri: req.session.github_redirect_uri,
      client_secret: app.conf.github_client_secret,
      code: req.query.code
    };
    req.session.github_redirect_uri = null;
    app.request({uri: uri, method: 'post', json: params}, function (err, resp, body) {
      if (err) return next(err);
      if (resp.statusCode !== 200) {
        console.error('status from post access_token', resp.statusCode);
        return res.renderStatus(resp.statusCode);
      }
      var access_token = body.access_token;
      app.request({uri: options.userUrl + '?access_token=' + access_token, json: true}, function (err, resp, body) {
        if (err) return next(err);
        if (resp.statusCode !== 200) {
          err = new Error('non-200 status from get user: ' + resp.statusCode);
          return next(err);
        }
        
      });
    });
  }

  function processError (req, res, next) {
    var err = new Error(req.query.error);
    err.code = req.query.error;
    next();
  }

  function doRedirect (req, res, next) {
    req.session.github_login_state = idgen(16);
    req.session.github_redirect_uri = req.href.href;
    var uri = '?';
    uri += app.qs.stringify({
      client_id: app.conf.github_client_id,
      redirect_uri: req.session.github_redirect_uri,
      scope: app.conf.github_scope,
      state: req.session.github_login_state
    });
    res.redirect(uri);
  }

  return controller.handler;
}
