console.log("Starting pt-flow server");

require("./modules/helpers.js"); // no return
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
    app.testEnvs = ["dev", "development", "test", "testing", "qa"];

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
var mongoInfo = mongo.parseConnectionURI(process.env["MONGO_DB_URL"]);
if (!mongoInfo) {
    throw Error("Either no MongoDB connection URL was provided or it was invalid. Please place one in an environment variable (\"MONGO_DB_URL\") with the format: [protocol][username:password@]host[:port]/database");
}


// GETs
app.get("/", routes.index);
app.get("/projects", routes.hasToken, routes.listProjects);
app.get("/project/:id", routes.hasToken, routes.viewProject);
app.get("/project/:id/edit", routes.hasToken, routes.editProject);
if (app.testEnvs.indexOf(process.env["NODE_ENV"]) > -1) {
    //pivotal.debug = true;
    app.get("/test-hook", routes.showHookText);
}

// POSTs
app.post("/", routes.index);
app.post("/projects", routes.getProjects);
app.post("/project/:id/stats/edit", routes.hasToken, routes.updateStats);
app.post("/activity-hook", routes.processActivityHook);


http.createServer(app).listen(app.get("port"), function () {
  console.log("pt-cfd server listening on port " + app.get("port"));
});
