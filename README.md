pt-flow
=======

A cumulative flow diagram statistics gatherer (and charter) for users of Pivotal Tracker.


## Server Installation

### Heroku Install

Assuming you have a verified [Heroku account](http://www.heroku.com/) and the [Heroku toolbelt](https://toolbelt.herokuapp.com/) installed:

```sh
git clone git@github.com:jakerella/pt-flow.git
cd pt-flow
heroku apps:create [optional app name]
heroku config:set NODE_ENV=[env name, e.g. "dev" or "production"]
heroku config:set PT_TOKEN=[Pivotal Tracker API token]
heroku config:set MONGO_DB_URL=[e.g. "username:password@domain.com/mydb"]
git push heroku [local branch:]master
```

You can get your API token at the bottom of your [Pivotal Tracker profile]([Pivotal Tracker API token](https://www.pivotaltracker.com/profile)) page. All of your `console.log()` statements will appear in the Heroku logs which you can view by running `heroku logs`. You may also want to review this guide to [Node.js on Heroku](https://devcenter.heroku.com/articles/nodejs).

#### Using a local Heroku MongoDB instance

You can use MongoDB from any server (see the options for setting up your mongo credentials above), but if you want to use Heroku's local instance of MongoDB you'll need to use their addon and specify `localhost` as the host for the DB server.
```sh
heroku addons:add mongolab
```

