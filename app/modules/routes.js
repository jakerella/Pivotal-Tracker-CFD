
var     e = require("./errors.js"),
    mongo = require("./mongo-helper.js");

var PIVOTAL_TOKEN_COOKIE = "ptcfd_token";

// This is our "auth" check for pages behind the token
exports.hasToken = function (req, res, next) {
    if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
        pivotal.useToken(req.cookies[PIVOTAL_TOKEN_COOKIE]);
        next();
    } else if (req.xhr) {
        res.send(403, { error: "You will need to login before accessing this resource" });
    } else {
        res.redirect("/");
    }
};

exports.index = function(req, res, next) {
    if (req.cookies[PIVOTAL_TOKEN_COOKIE] && req.session.projects) {
        res.redirect("/projects");
        return;
    }

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
    
    getUserProjects(req, function(err, projects) {
        if (err) {
            if (err.code) {
                next(new e.HttpError(
                    ((err.code == 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
                    err.code
                ));
            } else {
                next(new Error(err.toString(), 500));
            }
            return;
        }

        req.session.projects = projects;

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            token: req.session.token,
            projects: projects
        }));
        return;
    });
};

exports.listProjects = function(req, res, next) {
    if (req.session.projects) {
        
        renderProjectsPage(res, req.session.projects);
        return;

    } else {
        // We don't have projects, so go get them
        // NOTE: the token must be present already (and in pivotal module)
        //       based on the "hasToken()" middleware used in the routing in app.js
        
        getUserProjects(req, function(err, projects) {
            if (err) {
                if (err.code) {
                    next(new e.HttpError(
                        ((err.code == 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
                        err.code
                    ));
                } else {
                    next(new Error(err.toString(), 500));
                }
                return;
            }

            req.session.projects = projects;
            renderProjectsPage(res, projects);
            return;
        });
    }
};



// ------------- Private Helpers ------------- //

var renderProjectsPage = function(res, projects) {
    res.render('projects', {
        title: "PT Cumulative Flow Diagram - Projects",
        page: "projects",
        projects: projects
    });
};

var getUserProjects = function(dbScope, cb) {
    if (dbScope.isFunction()) { cb = dbScope; dbScope = {}; }

    pivotal.getProjects(function(err, ptData) {
        if (err) {
            console.log("Invalid user token provided", err);
            cb(err);
            return;
        }

        console.log(((ptData.project)?ptData.project.length:0) + " user projects retrieved from PT API");

        mongo.connect(dbScope, function(err, db) {
            if (err) { cb(err); }

            db.collection("stats", function(err, coll) {
                if (err) { cb(err); }

                coll.distinct("project", function(err, mongoData) {
                    if (err) { cb(err); }

                    // Cross reference projects user has access to with projects
                    // tracked by this system
                    var projects = [];
                    for (var i=0, l=ptData.project.length; i<l; ++i) {
                        if (mongoData.indexOf(Number(ptData.project[i].id)) > -1) {
                            projects.push(ptData.project[i]);
                        }
                    }

                    cb(null, projects);
                    return;
                });
            });
        });
    });
};
