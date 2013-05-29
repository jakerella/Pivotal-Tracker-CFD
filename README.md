Pivotal Tracker CFD
=======

A cumulative flow diagram statistics gatherer (and charter) for users of Pivotal Tracker.

Pivotal Tracker CFD is a small Node.js/Express/MongoDB app which gathers statistics from Pivotal Tracker using PT's [activity web hook](https://www.pivotaltracker.com/help/integrations#activity_web_hook) and provides a simple UI for viewing the resulting cumulative flow diagram. It includes basic authentication using PT API tokens. The intent is that while you can view the UI directly, you can easily include it as an iframe in any other reporting system that allows it.

## Server Installation

### Database (MongoDB)

You will need a MongoDB instance running somewhere (see the `MONGO_DB_URL` env variable below). You can get a small amount of free space on [MongoLab](https://mongolab.com). Combining that with a single free Heroku web dyno you can easily run this app live without any set up costs. Of course, scaling it is a different story. An example of the database connection URI:

```
mongodb://someuser:theirpass@abcd1234.mongolab.com/my-pt-stats
```

The database you create will need two collections: `stats` and `story`. These will be created if they do not exist already.
_NOTE: If your database already has these collections you could run into problems!_

### Heroku Install

Assuming you have a verified [Heroku account](http://www.heroku.com/) and the [Heroku toolbelt](https://toolbelt.herokuapp.com/) installed:

```sh
git clone git@github.com:jakerella/pt-flow.git
cd pt-flow
heroku apps:create [optional app name]
heroku config:set NODE_ENV=[env name, e.g. "dev" or "production" (defaults to "production", use "dev" to enable expanded error reporting and the testing page for web hooks)]
heroku config:set PT_TOKEN=[Pivotal Tracker API token]
heroku config:set MONGO_DB_URL=[protocol][username:password@]{host name}[:port]{/database}
git push heroku [local branch:]master
```

You can get your API token at the bottom of your [Pivotal Tracker profile](https://www.pivotaltracker.com/profile) page. All of your `console.log()` statements will appear in the Heroku logs which you can view by running `heroku logs`. (Unless you have a [separate logger](https://devcenter.heroku.com/articles/logging) set up for your app, which you may want to do!) You may also want to review this guide to [Node.js on Heroku](https://devcenter.heroku.com/articles/nodejs).

#### Using a local Heroku MongoDB instance

You can use MongoDB from any server (see the options for setting up your mongo credentials above), but if you want to use Heroku's local instance of MongoDB you'll need to use their addon and specify `localhost` as the host for the DB server.

```sh
heroku addons:add mongolab
```

### Server Install

You can run the Pivotal Tracker CFD app from just about any server. Here are the steps for doing so:

1. [Install git](http://git-scm.com)
2. [Install Node](http://nodejs.org)
3. Clone the app: `git clone git@github.com:jakerella/pt-flow.git`
4. Navigate to the app directory and run `npm install` to install all dependencies
5. Set up your database:
    * If you are using a local MongoDB instance, [install MongoDB](http://www.mongodb.org) and add a database
    * You can also use [MongoLab](http://mongolab.com), just set up an account, add a database, and copy the connection URL
6. Set these three environment variables:
    * NODE_ENV = [env name, e.g. "dev" or "production" (defaults to "production", use "dev" to enable expanded error reporting and the testing page for web hooks)]
    * PT_TOKEN = [Pivotal Tracker API token]
    * MONGO_DB_URL = [protocol][username:password@]{host name}[:port]{/database}
7. Start the app with `node app/app.js`

Note that the app will listen on port `5000` by default!


## Usage

### Collecting Data

In order to collect statistics you'll need to point your Pivotal Tracker project to your new app server. Go to your project settings and click on "Integrations" (you'll need to be a project owner), scroll down to "Activity Web Hook", and enter your new app URL plus `/activity-hook` in the "Web Hook URL" field (for example, it may be: `http://mydomain.com/activity-hook`). Click the "Save" button and you're ready to start collecting data!

### Logging In

When you visit your app for the first time you will be asked to log in, simply enter your Pivotal Tracker API token (found at the bottom of your [Pivotal Tracker profile](https://www.pivotaltracker.com/profile) page). The next screen will display the projects you have access to __and__ which are being tracked by your app. __NOTE: You will not see any projects (and will not be able to log in) until your app receives its first activity web hook!__

On the project selection screen, simply select the project you want to view. You will then be taken directly to the cumulative flow diagram for that project!


## The Future

Soon we will be adding more interactivity with the chart, some customization options, and other features.

### Contributing

Please feel free to fork this repo and submit pull requests - they will be reviewed and accepted or commented on as necessary. If there is not already an issue for the fix/feature you are interested in working on, please add it!


## Authors

* Jordan Kasper (@jakerella, [appendTo](http://appendTo.com))
