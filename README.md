## A demo of internal app authentication with Google Sign-In

This demonstrates how to use Google Sign-In for authenticating users to internal (mozilla.com) sites.

For a live demo visit [https://123done-dcoates.dev.lcip.org](https://123done-dcoates.dev.lcip.org)

## Docs

The [Google Sign-In](https://developers.google.com/identity/sign-in/web/devconsole-project) documentation is fairly comprehensive. Follow it to create an *client ID*. Also, here's the [client js API docs](https://developers.google.com/identity/sign-in/web/reference)

To whitelist an app to bypass the permissions screen see [this doc](https://developers.google.com/identity/work/it-apps).

The browser side is implemented in [index.html](static/index.html) and [123done.js](static/js/123done.js) (state.js can be ignored).

The server side is implemented in [server.js](server.js) configured by [config.json](config.json)

The authentication endpoint is `/api/auth`. Here it is at a glance:

```js
app.post('/api/auth', function (req, res) {
  // Verify the idtoken's (jwt) signature with the key set from the configured JKU.
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
```
