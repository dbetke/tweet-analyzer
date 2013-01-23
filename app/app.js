/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var tracker = require('./tracker');
var subjectTracker = new tracker(['republican', 'democrat'], ['love', 'hate']);

var cf = require('./cloudfoundry');

var app = module.exports = express.createServer();

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
app.get('/count/:field/:expr', routes.regex);
app.get('/:date', routes.date);

app.listen(cf.port || 3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
