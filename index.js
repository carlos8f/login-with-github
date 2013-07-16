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
  if (!options.client_id) throw new Error('options.client_id requried');
  if (!options.client_secret) throw new Error('options.client_secret required');

  // github api endpoints
  options.authorize_url || (options.authorize_url = 'https://github.com/login/oauth/authorize');
  options.access_token_url || (options.access_token_url = 'https://github.com/login/oauth/access_token');
  options.user_url || (options.user_url = 'https://api.github.com/user');

  if (typeof options.fetch_user === 'undefined') options.fetch_user = true;

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
    .get(options.login_path, function (req, res, next) {
      if (req.query.code) processCode(req, res, next);
      else if (req.query.error) processError(req, res, next);
      else doRedirect(req, res, next);
    })
    .add(function (req, res, next) {
      // continue to parent middleware chain
      next();
    })

  function doRedirect (req, res, next) {
    req.session.github_login_state = idgen(16);
    req.session.github_redirect_uri = req.href.href;
    var uri = options.authorize_url + '?';
    uri += qs.stringify({
      client_id: options.client_id,
      redirect_uri: req.session.github_redirect_uri,
      scope: options.scope,
      state: req.session.github_login_state
    });
    res.writeHead(302, {'Location': uri});
    res.end();
  }

  function processCode (req, res, next) {
    if (!req.session.github_login_state) return next(new Error('unknown login state'));
    if (!req.query.state) return next(new Error('state param required'));
    if (req.session.github_login_state !== req.query.state) return next(new Error('incorrect login state'));

    req.session.github_login_state = null;
    var uri = options.access_token_url + '?';
    var params = {
      client_id: options.client_id,
      redirect_uri: req.session.github_redirect_uri,
      client_secret: options.client_secret,
      code: req.query.code
    };
    req.session.github_redirect_uri = null;
    request({uri: uri, method: 'post', json: params}, function (err, resp, body) {
      if (err) return next(err);
      if (resp.statusCode !== 200) {
        err = new Error('non-200 status from post access_token: ' + resp.statusCode);
        err.response = body;
        return next(err);
      }
      req.github_access_token = body.access_token;
      if (options.fetch_user) {
        request({uri: options.user_url + '?access_token=' + req.github_access_token, json: true}, function (err, resp, body) {
          if (err) return next(err);
          if (resp.statusCode !== 200) {
            err = new Error('non-200 status from get user: ' + resp.statusCode);
            err.response = body;
            return next(err);
          }
          req.github_user = body;
          next();
        });
      }
      else next();
    });
  }

  function processError (req, res, next) {
    var err = new Error('error authenticating with github');
    err.code = req.query.error;
    next(err);
  }

  return controller.handler;
}
