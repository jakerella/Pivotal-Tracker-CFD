
var     e = require("./errors.js"),
     data = require("./data-helper.js");

var PIVOTAL_TOKEN_COOKIE = "ptcfd_token";

// This is our "auth" check for pages behind the token
exports.hasToken = function (req, res, next) {
    if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
        req.session.token = req.cookies[PIVOTAL_TOKEN_COOKIE];
        pivotal.useToken(req.cookies[PIVOTAL_TOKEN_COOKIE]);
        next();
    } else if (req.xhr) {
        res.send(403, { error: "You will need to login before accessing this resource" });
    } else {
        res.redirect("/");
    }
};

exports.index = function(req, res, next) {
    if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
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
    
    data.getUserProjects(req, function(err, projects) {
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
        
        data.getUserProjects(req, function(err, projects) {
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

exports.viewProject = function(req, res, next) {
    var i, project = null;

    if (req.session.projects) {
        
        if (req.session.projects) {
            for (i in req.session.projects) {
                if (req.session.projects[i].id == req.params.id) {
                    project = req.session.projects[i];
                }
            }
        }
        
        renderProjectPage(res, project);
        return;

    } else {
        // NOTE: the token must be present already (and in pivotal module)
        //       based on the "hasToken()" middleware used in the routing in app.js
        
        data.getUserProjects(req, function(err, projects) {
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

            for (var i in req.session.projects) {
                if (req.session.projects[i].id == req.params.id) {
                    project = req.session.projects[i];
                }
            }

            renderProjectPage(res, project);
            return;
        });
    }
};


// ------------- Private helpers ------------- //

var renderProjectsPage = function(res, projects) {
    res.render('projects', {
        title: "PT Cumulative Flow Diagram - Projects",
        page: "projects",
        projects: projects
    });
};

var renderProjectPage = function(res, project) {
    if (!project || !project.id) {
        res.send(404, "Sorry, but either that project does not exist in this system, or you do not have access to it!");
        return;
    }

    data.getStatsForProject(project.id, function(err, stats) {

        if (err) {
            next(new Error(err.toString(), 500));
            return;
        }

        res.render('project', {
            title: "PT Cumulative Flow Diagram - "+project.name,
            page: "project",
            project: project,
            stats: JSON.stringify(stats)
        });
    });
};
