
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

            mongo.getOrCreateCollection(db, "stats", function(err, coll) {
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

        mongo.getOrCreateCollection(db, "stats", function(err, coll) {
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


exports.processStoryUpdate = function(activity, storyUpdate, scope, cb) {
    if (scope.isFunction()) { cb = scope; scope = null; }
    cb = (cb && cb.isFunction()) ? cb : function() {};
    scope = (scope || {});

    var actTime = new Date(activity.occurred_at);

    verifyPTActivity(activity, function(err, data) {
        if (err) { cb(err); return; }

        console.log("Validity of activity verified!");
        
        // was this a status change?
        if (!storyUpdate.current_state) {
            console.log("This was not a status update, nothing to do");
            cb(null, {
                "action": "noop",
                "story": storyUpdate.id
            });
            return;
        }

        pivotal.getStory(activity.project_id, storyUpdate.id, function (err, story) {
            if (err) { cb(err); return; }

            mongo.getOrCreateStory(
                {
                       project_id: story.project_id,
                               id: story.id,
                    current_state: storyUpdate.current_state
                },
                scope,
                function(err, local) {
                    if (err) { cb(err); return; }

                    var prevStatus = local.current_state,
                                 m = actTime.getMonth() + 1,
                                 d = actTime.getDate(),
                           actCymd = actTime.getFullYear()+"-"+((m > 9)?m:"0"+m)+"-"+((d > 9)?d:"0"+d);
                    
                    mongo.getOrCreateStats(
                        activity.project_id, 
                        actCymd, 
                        scope,
                        function(err, stats) {
                            if (err) { cb(err); return; }

                            // update the stats and story documents
                            
                            if (prevStatus != storyUpdate.current_state && stats[prevStatus]) {
                                // only update previous state count if we're tracking it
                                // and no negatives!
                                stats[prevStatus] = Math.max(0, stats[prevStatus] - 1);
                            }
                            // increment the new state, again only if we're tracking it
                            if (typeof stats[storyUpdate.current_state] != "undefined") {
                                stats[storyUpdate.current_state]++;
                            }
                            // set the new state in our local DB object
                            local.current_state = storyUpdate.current_state;
                            
                            // Do the DB updates
                            mongo.connect(scope, function(err, db) {
                                if (err) { cb(err); return; }

                                mongo.getOrCreateCollection(db, "stats", function(err, coll) {
                                    if (err) { cb(err, null); return; }

                                    // update the statistics for this date in our DB
                                    coll.update({_id: stats._id}, stats, {safe: true}, function(err) {
                                        if (err) { cb(err, null); return; }
                                        console.log("Stats document saved");

                                        mongo.getOrCreateCollection(db, "story", function(err, coll) {
                                            if (err) {
                                                console.error("The stats document was updated but there was an error updating the story!", local, actCymd);
                                                cb(err, null); return;
                                            }

                                            // update the story status in our DB
                                            coll.update({_id: local._id}, local, {safe: true}, function(err) {
                                                if (err) { cb(err, null); return; }

                                                console.log("Story document saved");
                                                cb(null, {
                                                    stats: stats,
                                                    story: story,
                                                    localStory: local
                                                });
                                            });
                                        });
                                    });
                                });

                            });
                        }
                    );
                }
            );

        });
    });
};



// ------------- Private Helpers ------------ //

var verifyPTActivity = function(activity, cb) {
    cb = (cb && cb.isFunction()) ? cb : function() {};

    pivotal.getActivities({
        
        project: activity.project_id,
        limit: 20
        // There is an option to pass in "occurred_since_date", but for the 
        // life of me I can't get it to do anything, even withvalid input.
        // Unfortuantely, that means I just get the latest 20 updates for this 
        // project and make sure our update is in there.

    }, function (err, data) {
        if (err) {
            cb(err.desc, null);

        } else if (data && data.activity && Array.isArray(data.activity)) {
            for (var i=0, l=data.activity.length; i<l; ++i) {
                if (data.activity[i].id === activity.id) {
                    // we found the mathcing activity, we could check the story
                    // update content if we need more validation...
                    cb(null, data.activity[i]);
                    return;
                }
            }
            console.error("Data returned by PT API wrapper for this activity does not match (ID: "+activity.id+")", data);
            cb(Error("Invalid activity provided to POST web hook"), null);

        } else {
            console.error("Invalid activity data returned by PT API", data);
            cb(Error("Invalid activity data returned by PT API"), null);
        }
        return;
    });
};
