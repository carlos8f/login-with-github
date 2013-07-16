login-with-github
=================

middleware making it easy to use github as authentication

## Usage

Call `require('login-with-github')()` which returns a middleware handler
suitable to use with express/connect or middler.

## Requirements

- [github app](https://github.com/settings/applications) credentials
- `req.session` either provided by express/connect or [sess](https://github.com/carlos8f/sess).

## Options

- `client_id` (String, required) - client ID of your github app
- `client_secret` (String, required) - client secret of your github app
- `scope` (String) - comma-separated scopes to include in the authorization
- `login_path` (String) - a specific path such as `/login/github` to trigger
  OAuth redirect on. By default, path is not checked.
- `fetch_user` (Boolean, default: `true`) - Fetch the logged-in github user and
  expose it on `req.github_user`

### Endpoint options

- `authorize_url` (String, default: `https://github.com/login/oauth/authorize`) -
  github endpoint for authorization
- `access_token_url` (String, default: `https://github.com/login/oauth/access_token`) -
  github endpoint for access token
- `user_url` (String, default: `https://api.github.com/user`) - github endpoint
  to fetch current user

## Example

Without using a framework:

```js
var loginHandler = require('login-with-github')({
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
```

Also [see this example](https://github.com/carlos8f/login-with-github/tree/master/example/motley)
using the [motley framework](https://github.com/carlos8f/motley).

- - -

### Developed by [Terra Eclipse](http://www.terraeclipse.com)
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

- - -

### License: MIT

- Copyright (C) 2013 Carlos Rodriguez (http://s8f.org/)
- Copyright (C) 2013 Terra Eclipse, Inc. (http://www.terraeclipse.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the &quot;Software&quot;), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
