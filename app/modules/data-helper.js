
var     e = require("./errors.js"),
    mongo = require("./mongo-helper.js");

exports.getUserProjects = function(dbScope, cb) {
    if (dbScope.isFunction()) { cb = dbScope; dbScope = {}; }

    pivotal.getProjects(function(err, ptData) {
        if (err) {
            console.log("Invalid user token provided", err);
            cb(err);
            return;
        }

        console.log(((ptData.project)?ptData.project.length:0) + " user projects retrieved from PT API");

        mongo.connect(dbScope, function(err, db) {
            if (err) { cb(err); return; }

            db.collection("stats", function(err, coll) {
                if (err) { cb(err); return; }

                coll.distinct("project", function(err, mongoData) {
                    if (err) { cb(err); return; }

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


exports.getStatsForProject = function(project, options, cb) {
    if (options.isFunction()) { cb = options; options = null; }
    options = (options || {});
    options.scope = (options.scope || {});
    project = Number(project);

    if (!project) {
        cb("Please provide a valid project ID to get statistics");
        return;
    }

    mongo.connect(options.scope, function(err, db) {
        if (err) { cb(err); return; }

        db.collection("stats", function(err, coll) {
            if (err) { cb(err); return; }

            coll
            .find({ "project": project })
            .sort({ "date": 1 })
            .toArray(function(err, stats) {
                if (err) { cb(err); return; }

                cb(null, stats);
                return;
            });
        });
    });
};
