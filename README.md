Pivotal Tracker CFD
=======

A cumulative flow diagram statistics gatherer (and charter) for users of Pivotal Tracker.

This is a small Node.js/Express/MongoDB app that you publish live somewhere which gathers statistics from Pivotal Tracker using their [activity web hook](https://www.pivotaltracker.com/help/integrations#activity_web_hook) and includes a slim UI for viewing the resulting cumulative flow diagram. It includes basic authentication using PT API tokens and will (soon) include some customizations and aggregated statistics for the chart.

## Server Installation

### Database (MongoDB)

You will need a MongoDB instance running somewhere (see the `MONGO_DB_URL` env variable below). You can get a small amount of free space on [MongoLab](https://mongolab.com). Combining that with a single free Heroku web dyno you can easily run this app live without any set up costs. Of course, scaling it is a different story. An example of the database connection URI:
```
mongodb://someuser:theirpass@abcd1234.mongolab.com/my-pt-stats
```

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

You can get your API token at the bottom of your [Pivotal Tracker profile]([Pivotal Tracker API token](https://www.pivotaltracker.com/profile)) page. All of your `console.log()` statements will appear in the Heroku logs which you can view by running `heroku logs`. You may also want to review this guide to [Node.js on Heroku](https://devcenter.heroku.com/articles/nodejs).

#### Using a local Heroku MongoDB instance

You can use MongoDB from any server (see the options for setting up your mongo credentials above), but if you want to use Heroku's local instance of MongoDB you'll need to use their addon and specify `localhost` as the host for the DB server.
```sh
heroku addons:add mongolab
```

## Usage

TODO


## Authors

* Jordan Kasper (@jakerella)
* Ryan Neimeyer (@rneimeyer)
