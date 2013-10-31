console.log("Starting pt-flow server");

require("./modules/helpers.js"); // no return
var express = require("express"),
    http = require("http"),
    e = require("./modules/errors.js"),
    xmlParser = require("./modules/xml-parser.js"),
    routes = require("./modules/routes.js"),
    mongo = require("./modules/mongo-helper.js");

// Set to global so we can call useToken once (below)
global.pivotal = require("pivotal");

var app = express();

// Config and middleware
app.configure(function () {
    process.env.NODE_ENV = (process.env.NODE_ENV || "production");

    app.set("port", process.env.PORT || 5000);
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");
    app.use(express.logger("dev"));
    app.use(xmlParser);
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser("huADnaQnwJXbh3A49VFA"));
    app.use(express.session());
    app.use(express.static(__dirname + "/public"));
    app.use(app.router);
});

// Error handling
app.use(e.handleAppError);


// Pivotal Tracker API token
if (!process.env.PT_TOKEN || !process.env.PT_TOKEN.length) {
    throw new Error("No Pivotal Tracker token is set in the env var: \"PT_TOKEN\". This is required to process activity web hooks!");
}
console.log("Using server PT API token: " + process.env.PT_TOKEN);

// Mongo DB connection info
var mongoInfo = mongo.parseConnectionURI(process.env.MONGO_DB_URL);
if (!mongoInfo) {
    throw new Error("Either no MongoDB connection URL was provided or it was invalid. Please place one in an environment variable (\"MONGO_DB_URL\") with the format: [protocol][username:password@]host[:port]/database");
}
console.log("Using Mongo URI: " + process.env.MONGO_DB_URL);


// ROUTING

// GETs
app.get("/", routes.index);
app.get("/projects", routes.hasToken, routes.listProjects);
app.get("/project/:id", routes.hasToken, routes.viewProject);
app.get("/project/:id/edit", routes.hasToken, routes.editProject);
if (process.env.NODE_ENV === "development") {
    //pivotal.debug = true;
    app.get("/test-hook", routes.showHookText);
}

// POSTs
app.post("/", routes.index);
app.post("/projects", routes.getProjects);
app.post("/project/:id/stats/edit", routes.hasToken, routes.updateStats);
app.post("/activity-hook", routes.processActivityHook);

// 404 page
app.get("*", function(req, res, next) {
    if (/\.(css|js|map|ico|png|jpg|gif|bmp|tif)$/.test(req.url)) { next(); return; }
    e.handleAppError(new e.HttpError("Sorry, but I couldn't find this page! (" + req.url + ")", 404), req, res, next);
});


// Start up the server

http.createServer(app).listen(app.get("port"), function () {
    console.log("pt-cfd server listening on port " + app.get("port"));
});
