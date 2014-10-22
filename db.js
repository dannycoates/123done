var config = require('./config.json')
var request = require('request')

module.exports.get = function (token, cb) {
  request(
    {
      method: 'GET',
      url: config.kv_uri + '/123done',
      headers: {
        Authorization: 'Bearer ' + token
      }
    },
    function (err, res, body) {
      console.log('db.get', err, body)
      cb(err, body)
    }
  )
}

module.exports.set = function (token, value, cb) {
  request(
    {
      method: 'PUT',
      url: config.kv_uri + '/123done',
      headers: {
        Authorization: 'Bearer ' + token
      },
      json: value
    },
    function (err, res, body) {
      console.log('db.set', err, body)
      if (cb) { cb(err, body) }
    }
  )
}
