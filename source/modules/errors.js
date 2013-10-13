
var util = require("util");

var AppError = function (msg, status, constr) {
    Error.captureStackTrace(this, constr || this);
    if (msg) { this.message = msg; }
    if (status) { this.status = status; }
};
util.inherits(AppError, Error);
AppError.prototype.name = "Application Error";
AppError.prototype.status = 0;

var HttpError = function (msg, status, constr) {
    AppError.apply(this, [msg, status, constr]);
};
util.inherits(HttpError, Error);
HttpError.prototype.name = "HTTP Error";
HttpError.prototype.status = 500;

var BadRequestError = function (msg, status, constr) {
    HttpError.apply(this, [msg, status, constr]);
};
util.inherits(BadRequestError, HttpError);
BadRequestError.prototype.name = "Bad Request Error";
BadRequestError.prototype.status = 400;

var AuthError = function (msg, status, constr) {
    AppError.apply(this, [msg, status, constr]);
};
util.inherits(AuthError, AppError);
AuthError.prototype.name = "Authentication Error";
AuthError.prototype.status = 401;

var DatabaseError = function (msg, status, constr) {
    AppError.apply(this, [msg, status, constr]);
};
util.inherits(DatabaseError, AppError);
DatabaseError.prototype.name = "Database Error";
DatabaseError.prototype.status = 500;

module.exports = {
    AppError: AppError,
    HttpError: HttpError,
    BadRequestError: BadRequestError,
    AuthError: AuthError,
    DatabaseError: DatabaseError,
    
    getErrorObject: function(err) {
        var errObj;

        if (err instanceof AppError) {
            errObj = err;
        } else if (err instanceof Error) {
            errObj = new AppError(err.message);
        } else  if (err.desc) {
            errObj = new AppError(err.desc, (err.code || null));
        } else {
            errObj = new AppError(err.toString());
        }

        return errObj;
    },

    handleAppError: function(err, req, res, next) {
        var eObj = module.exports.getErrorObject(err);

        console.error(eObj.stack);

        if (req.xhr) {
            res.send((eObj.status || 500), { error: eObj.message, status: eObj.status });
        } else {
            res.status(500);
            res.render("error", { error: eObj, printStack: (process.env.NODE_ENV === "development"), title: "Oops!", page: "error" });
        }
    }
};