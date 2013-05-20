
var     e = require("./errors.js"),
    mongo = require("./mongo-helper.js");

exports.index = function(req, res) {
    res.render('index', { title: "PT Cumulative Flow Diagram - Login", page: "login" });
};

exports.getProjects = function(req, res, next) {
    console.log("getting projects for user token: ", req.body.token);
    if (!req.body.token || !req.body.token.length) {
        next(new e.HttpError("Please provide a valid Pivotal Tracker API token", 403));
        return;
    }

    // reset these values on new request
    req.session.token = req.body.token;
    req.session.projects = [];

    pivotal.useToken(req.body.token);
    pivotal.getProjects(function(err, ptData) {
        if (err) {
            console.log("Invalid user token provided", err);

            next(new e.HttpError(
                ((err.code == 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc), 
                err.code
            ));
            return;
        }

        console.log(((ptData.project)?ptData.project.length:0) + " user projects retrieved from PT API");

        mongo.connect(req, function(err, db) {
            if (err) { throw Error(err.toString()); }

            db.collection("stats", function(err, coll) {
                if (err) { throw Error(err.toString()); }

                coll.distinct("project", function(err, mongoData) {
                    if (err) { throw Error(err.toString()); }

                    // Cross reference projects user has access to with projects
                    // tracked by this system
                    var projects = req.session.projects = [];
                    for (var i=0, l=ptData.project.length; i<l; ++i) {
                        if (mongoData.indexOf(Number(ptData.project[i].id)) > -1) {
                            projects.push(ptData.project[i]);
                        }
                    }

                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({
                        token: req.session.token,
                        projects: projects
                    }));
                    return;
                });
            });
        });
    });
};
