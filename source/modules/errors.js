
var util = require("util");

var HttpError = function (msg, status, constr) {
    Error.captureStackTrace(this, constr || this);
    this.message = msg || "HTTP Error";
    this.status = status || 500;
};
util.inherits(HttpError, Error);
HttpError.prototype.name = "HTTP Error";
HttpError.prototype.status = 500;

var BadRequestError = function (msg, status, constr) {
    Error.captureStackTrace(this, constr || this);
    this.message = msg || "Bad Request Error";
    this.status = status || 400;
};
util.inherits(BadRequestError, HttpError);
BadRequestError.prototype.name = "Bad Request Error";
BadRequestError.prototype.status = 400;

var AuthError = function (msg, status, constr) {
    Error.captureStackTrace(this, constr || this);
    this.message = msg || "Authentication Error";
    this.status = status || 401;
};
util.inherits(AuthError, HttpError);
AuthError.prototype.name = "Authentication Error";
AuthError.prototype.status = 401;

var DatabaseError = function (msg, status, constr) {
    Error.captureStackTrace(this, constr || this);
    this.message = msg || "HTTP Error";
    this.status = status || 500;
};
util.inherits(DatabaseError, Error);
DatabaseError.prototype.name = "Database Error";
DatabaseError.prototype.status = 500;

module.exports = {
    HttpError: HttpError,
    BadRequestError: BadRequestError,
    AuthError: AuthError,
    DatabaseError: DatabaseError
};