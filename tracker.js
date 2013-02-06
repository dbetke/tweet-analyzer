var twitter = require('immortal-ntwitter');
var redis = require('redis');
var cf = require('./cloudfoundry');
var credentials = require('./credentials.js');
var mongoose = require('mongoose');
var db = mongoose.connection;

mongoose.connect('mongodb://localhost/tweets'); //connect to the tweets database

var db = mongoose.connection; 
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log("mongodb is connected!!");
});

var Tweet = require('./models/tweet'); //require model, pull in model created

function Tracker() {
    var client;
    
    var redis_host =  cf.redis?cf.redis.credentials.host:'localhost';
    var redis_port = cf.redis?cf.redis.credentials.port:6379;
    var redis_password = cf.redis?cf.redis.credentials.password:undefined;

    client = redis.createClient(redis_port, redis_host);
    
    if(cf.runningInTheCloud) {
        client.auth(redis_password);
    }

    var t = new twitter({
        consumer_key: credentials.consumer_key,
        consumer_secret: credentials.consumer_secret,
        access_token_key: credentials.access_token_key,
        access_token_secret: credentials.access_token_secret
    });

    var makeDate = function(tweet) {
        var d = (tweet.created_at);
        var month = new Date(Date.parse(d)).getMonth()+1;
        var day = new Date(Date.parse(d)).getDate();
        var year = new Date(Date.parse(d)).getFullYear();
        var date = (year + "-" + month + "-" + day);

        return date;
    }

    this.track = function(subjects, keywords) {
        t.immortalStream(
            'statuses/filter',
            { track: subjects },
            function(stream) {
                stream.on('data', function(tweet) {
                    var date = makeDate(tweet);
		    var tweetString = JSON.stringify(tweet); //convert object to string for storage
                    var keyword1_re = new RegExp("(\\s|^)" + keywords[0] + "(\\s|$)", "i"); 
                    var keyword2_re = new RegExp("(\\s|^)" + keywords[1] + "(\\s|$)", "i"); 

                    subjects.forEach(function(subject) {    
                        if(tweet.text.match(subject)) {
                            if(tweet.text.match(keyword1_re)) {
                                client.hincrby(date, subject+keywords[0],'1', redis.print);
				console.log(subject + " " + keywords[0] + "\nTweet: " + tweet.text);
				var newTweet = new Tweet({subject: subject, keyword: keywords[0], date : date, tweet : tweetString});
				newTweet.save(function(err, newTweet){
				    if (err){
				      console.log(err);
				    }
				    else{
				      console.log("the tweet was saved to the database\n"); 
				    }
			       });
			     };
              
                            if(tweet.text.match(keyword2_re)) {
                                client.hincrby(date, subject+keywords[1], '1', redis.print);
                                console.log(subject + " " + keywords[1] + "\nTweet: " + tweet.text); 
				var newTweet = new Tweet({subject: subject, keyword: keywords[1], date : date, tweet : tweetString});
				newTweet.save(function(err, newTweet){
				    if (err){
				      console.log(err);
				    }
				    else{
				      console.log("the tweet was saved to the database\n"); 
				    }
			       });
                            }
                        }
                    });
                });
                
                stream.on('error', function (err) {
                    console.log(err);
                });

                stream.on('end', function (response) {
                    console.log('end event fired!');
                    console.log(response);
                });

                stream.on('destroy', function (response) {
                    console.log('destroy event fired!');
                    console.log(response);
                });

            } // f(stream)
        ); // t.immortalStream
    } // track()
}

module.exports = Tracker;
