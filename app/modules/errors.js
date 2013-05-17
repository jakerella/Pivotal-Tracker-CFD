
var util = require("util");

var HttpError = function (msg, status, constr) {
    Error.captureStackTrace(this, constr || this);
    this.message = msg || 'HTTP Error';
    this.status = status || 500;
};
util.inherits(HttpError, Error);
HttpError.prototype.name = 'HTTP Error';
HttpError.prototype.status = 500;

module.exports = {
  HttpError: HttpError
};