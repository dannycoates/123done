var data = {}

module.exports.get = function (key, cb) {
  cb(null, data[key])
}

module.exports.set = function (key, value, cb) {
  data[key] = value
  if (cb) { cb(null, null) }
}
