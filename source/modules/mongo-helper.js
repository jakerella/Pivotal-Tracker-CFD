// Helper functions for managing MongoDB

var           e = require("./errors.js"),
          mongo = require("mongodb");
         Server = mongo.Server,
             Db = mongo.Db,
    connectInfo = null;

// constants
var CONNECT_TIMEOUT  = 2000; // for multiple simultaneous connections
    CONNECT_INTERVAL = 100;  // for multiple simultaneous connections


/**
 * Parses a connection URI, including username/password, port, and protocol.
 * NOTE: this must be called before trying to connect to the Mongo server!
 * 
 * @param  {string} uri The connection URI string in the format: [protocol][username:password@]host[:port]/database
 * @return {object}     The parsed pieces of the connection URI
 */
exports.parseConnectionURI = function(uri) {
    uri = (uri)?uri.toString():"";

    var m = uri.match(/^(?:mongodb\:\/\/)?(?:([^\/\:]+)\:([^\/\:@]+)@)?([^@\/\:]+)(?:\:([0-9]{1,5}))?\/(.+)$/i);
    if (m) {
        connectInfo = {
            "host": m[3],
            "port": (m[4] || 45027),
            "user": (m[1] || null),
            "pass": (m[2] || null),
              "db": m[5],
             "uri": uri
        };
    }

    return connectInfo;
};


/**
 * Opens a connection to the Mongo server (and database). If one is already 
 * open within the scope provided, then it is returned. Simultaneous calls 
 * to this method with the same scope will work by waiting for the first 
 * request to complete.
 * 
 * @param  {object}   scope      The scope for the db connection (most likely the http request)
 * @param  {Function} cb         A callback for when the database is ready: function(err, db) { ... }
 */
exports.connect = function(scope, cb, _startTime) {
    _startTime = (_startTime || (new Date()).getTime());
    if (scope && scope.isFunction()) { cb = scope; scope = null; }

    if (((new Date()).getTime() - _startTime) > CONNECT_TIMEOUT) {
        cb(new e.DatabaseError("Timeout while trying to connect to MongoDB server"));
        return;
    }

    if (scope.mongoStartup) {
        setTimeout(function() {
            exports.connect(scope, cb, _startTime);
        }, CONNECT_INTERVAL);
    } else {
        doConnect(scope, (cb || function() {}));
    }
};


exports.getOrCreateCollection = function(db, collName, cb) {
    cb = (cb && cb.isFunction()) ? cb : function() {};

    // createCollection without the "safe" option will 
    // return the collection if it already exists
    db.createCollection(collName, function(err, coll) {
        if (err) { cb(err); return; }

        cb(null, coll);
        return;
    });
};


exports.getOrCreateStory = function(story, dbScope, cb) {
    if (dbScope.isFunction()) { cb = dbScope; dbScope = null; }
    cb = (cb && cb.isFunction()) ? cb : function() {};
    dbScope = (dbScope || {});

    var self = this;
    self.connect(dbScope, function(err, db) {
        if (err) { cb(err); return; }

        self.getOrCreateCollection(db, "story", function(err, coll) {
            if (err) { cb(err, null); return; }

            coll
            .find({ "project": Number(story.project_id), "story": Number(story.id) })
            .toArray(function(err, recs) {
                if (err) { cb(err, null); return; }

                if (recs.length) {
                    // return existing story document
                    cb(null, recs[0]);
                    return;

                } else {
                    console.log("No existing story document for this ID ("+story.id+"), creating it...");

                    coll.insert(
                        {
                               "project": Number(story.project_id),
                                 "story": Number(story.id),
                            "current_state": story.current_state
                        },
                        function(err, recs) {
                            if (err) { cb(err, null); return; }

                            cb(null, recs[0]);
                            return;
                        }
                    );
                }
            });
        });
    });
};

exports.getOrCreateStats = function(project, date, dbScope, cb) {
    if (dbScope.isFunction()) { cb = dbScope; dbScope = null; }
    cb = (cb && cb.isFunction()) ? cb : function() {};
    dbScope = (dbScope || {});

    var self = this;
    self.connect(dbScope, function(err, db) {
        if (err) { cb(err); return; }

        self.getOrCreateCollection(db, "stats", function(err, coll) {
            if (err) { cb(err, null); return; }

            coll
            .find({ "project": Number(project), "date": date })
            .limit(1)
            .toArray(function(err, recs) {
                if (err) { cb(err, null); return; }

                if (recs.length) {
                    // return existing stats document for this project/date
                    cb(null, recs[0]);
                    return;

                } else {
                    coll
                    .find({ "project": Number(project), "date": {$lt: date} })
                    .limit(1)
                    .sort({ "date": -1 })
                    .toArray(function(err, recs) {
                        if (err) { cb(err, null); return; }

                        if (recs.length) {
                            console.log("Cloning previous stats document from "+recs[0].date+" for "+project+"/"+date);
                            
                            coll.insert({

                                    "project": Number(project),
                                       "date": date,
                                "unscheduled": recs[0].unscheduled,
                                  "unstarted": recs[0].unstarted,
                                    "started": recs[0].started,
                                   "finished": recs[0].finished,
                                  "delivered": recs[0].delivered,
                                   "accepted": recs[0].accepted

                            }, function(err, rec) {
                                if (err) { cb(err, null); return; }

                                if (Array.isArray(rec)) { rec = rec[0]; }
                                cb(null, rec);
                                return;
                            });

                        } else {

                            console.log("No previous stats document exists for "+project+", starting fresh at "+date);
                            coll.insert({

                                 "project": Number(project),
                                    "date": date,
                                "unscheduled": 0,
                                  "unstarted": 0,
                                    "started": 0,
                                   "finished": 0,
                                  "delivered": 0,
                                   "accepted": 0

                            }, function(err, rec) {
                                if (err) { cb(err, null); return; }

                                if (Array.isArray(rec)) { rec = rec[0]; }
                                cb(null, rec);
                                return;
                            });
                        }
                    });
                }
            });
        });
    });
};


// -------------- Private Module Functions --------------- //

// internal use only
var doConnect = function(scope, cb) {
    var dbi;

    if (scope) {
        dbi = scope.mongoInstance;
        scope.mongoStartup = true;
    }

    // if we already have a DB instance, callback immediately
    if (dbi && dbi.openCalled) {
        console.log("MongoDB conenction already open... returning current db instance");
        if (scope) { scope.mongoStartup = false; }
        cb(null, dbi);
        return;
    }
    // clear out existing instance
    dbi = null;
    if (scope) { scope.mongoInstance = null; }

    // otherwise we'll need to open a new connection, so 
    if (!connectInfo) {
        if (scope) { scope.mongoStartup = false; }
        cb(new e.DatabaseError("There is no database connection information!"));
        return;
    }
    
    var server = new Server(connectInfo.host, connectInfo.port, {auto_reconnect : true});
    dbi = new Db(connectInfo.db, server, {safe: false});
    if (scope) { scope.mongoInstance = dbi; }

    console.log("Connecting to MongoDB instance...");
    dbi.open(function(err, client) {
        if (err) {
            if (scope) { scope.mongoStartup = false; }
            cb(err);
            return;
        }

        console.log("...connected");

        if (connectInfo.user && connectInfo.pass) {
            console.log("Authenticating MongoDB connection using: "+connectInfo.user+" / ****...");
            client.authenticate(connectInfo.user, connectInfo.pass, function(err, success) {
                if (err) {
                    if (scope) { scope.mongoStartup = false; }
                    cb(err);
                    return;
                }

                if (success) {
                    console.log("...authentication success, returning new db instance");

                    if (scope) { scope.mongoStartup = false; }
                    cb(null, dbi);
                    return;

                } else {
                    if (scope) { scope.mongoStartup = false; }
                    cb(new e.DatabaseError("Unable to authenticate with MongoDB server"));
                    return;
                }
            });

        } else {
            console.log("No authentication requested, returning new db instance");
            if (scope) { scope.mongoStartup = false; }
            cb(null, dbi);
            return;
        }
    });
};
