console.log("Starting pt-flow server");

var     express = require("express"),
           http = require("http"),
      xmlParser = require("./modules/xml-parser.js"),
         routes = require("./modules/routes.js"),
          mongo = require("./modules/mongo-helper.js");

// Set to global so we can call useToken once (below)
global.pivotal = require("pivotal");

var app = express();

// Config and middleware
app.configure(function () {
    process.env["NODE_ENV"] = (process.env["NODE_ENV"] || "production");

    app.set("port", process.env.PORT || 5000);
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");
    app.use(express.logger("dev"));
    app.use(xmlParser);
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser("huADnaQnwJXbh3A49VFA"));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
});

// Error handling
app.configure("dev", function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure("production", function () {
    app.use(express.errorHandler());
});


// Pivotal Tracker API token
if (!process.env["PT_TOKEN"] || !process.env["PT_TOKEN"].length) {
    throw Error("No Pivotal Tracker token is set in the env var: \"PT_TOKEN\". This is required to process activity web hooks!");
}

// Mongo DB connection info
if (process.env["MONGO_DB_URL"]) {
    var mongoInfo = mongo.parseConnectionURI(process.env["MONGO_DB_URL"]);
    if (mongoInfo) {
        app.set("mongoInfo", mongoInfo);
    } else {
        throw Error("An invalid MongoDB connection URL was provided, it should follow the format: [protocol][username:password@]host[:port]/database");
    }

} else {
    throw Error("No MongoDB connection URL is set in the env var: \"MONGO_DB_URL\". Please set it!");
}


// object helpers
Object.defineProperty(
    Object.prototype, 
    'isFunction',
    {
        writable : false,
        enumerable : false, 
        configurable : false,
        value : function () {
            return {}.toString.call(this) === "[object Function]";
        }
    }
);
// object key iterator (operates just like Array.forEach)
Object.defineProperty(
    Object.prototype, 
    'each',
    {
        writable : false,
        enumerable : false, 
        configurable : false,
        value : function (f, ignoreFunctions) {
            var obj = this;
            ignoreFunctions = !!ignoreFunctions;
            Object.keys(obj).forEach( function(key) { 
                if (ignoreFunctions && obj[key].isFunction()) { return; }
                f( obj[key], key );
            });
        }
    }
);


// GETs
app.get("/", routes.index);
//app.get("/stats/:id", routes.hasToken, routes.getStatsForProject);

// POSTs
app.post("/projects", routes.getProjects);
//app.post("/activity-hook", routes.hasToken, routes.activityHook);


http.createServer(app).listen(app.get("port"), function () {
  console.log("pt-flow server listening on port " + app.get("port"));
});