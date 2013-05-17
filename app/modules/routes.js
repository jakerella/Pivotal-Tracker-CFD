
var e = require("./errors.js");

exports.index = function (req, res) {
    res.render('index', { title: "PT Cumulative Flow Diagram - Login", page: "login" });
};

exports.getProjects = function (req, res, next) {
    console.log("getting projects for user token: ", req.body.token);
    if (!req.body.token || !req.body.token.length) {
        next(new e.HttpError("Please provide a valid Pivotal Tracker API token", 403));
        return;
    }

    pivotal.useToken(req.body.token);
    pivotal.getProjects(function(err, data) {
        if (err) {
            console.log("Invalid user token provided", err);

            next(new e.HttpError(
                ((err.code == 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc), 
                err.code
            ));
            return;
        }

        console.log(((data.project)?data.project.length:0) + " user projects retrieved from PT API");

        // TODO: cross-ref with projects that are tracking stats in this system

        req.session.projects = data.project;
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            isValidToken: true,
            projects: data.project 
        }));
        return;
    });
};
