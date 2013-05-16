
var utils = require('../../node_modules/express/node_modules/connect/lib/utils');
var xml2js = require('xml2js');

var parser = new xml2js.Parser({
    explicitArray : false,
    ignoreAttrs   : true,
    explicitRoot  : false
});

module.exports = function (request, response, next) {
    if (request._body) {
        return next();    
    }
    
    request.body = request.body || {};

    // ignore GET
    if (request.method === 'GET' || request.method === 'HEAD') {
        return next();
    }

    // check Content-Type
    if (utils.mime(request) !== 'text/xml' && utils.mime(request) !== 'application/xml') {
        return next();
    }

    // flag as parsed
    request._body = true;

    // parse
    var buffer = '';
    request.setEncoding('utf8');
    request.on('data', function (chunk) {
        buffer += chunk;
    });

    request.on('end', function () {
        parser.parseString(buffer, function (err, json) {
            if (err) {
                err.status = 400;
                next(err);
            } else {
                request.body = json;
                next();
            }
        });
    });
};
