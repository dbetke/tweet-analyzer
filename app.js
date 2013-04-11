/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var Tracker = require('./tracker');
var subjectTracker = new Tracker();
subjectTracker.UseCollection('tweetdb', 'tweets'); //set db name and collection name
subjectTracker.track(["dogs", "cats"], ["love", "hate"]);
subjectTracker.usePrefix('NINA-');

var app = module.exports = express();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/destroy', function(req, res) {
    subjectTracker.destroy();
    res.send("Tracker destroyed.");
});
app.get('/count/:field/:expr', routes.regex);
app.get('/:date', routes.date);

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port " + process.env.PORT);
});
