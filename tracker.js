var twitter = require('immortal-ntwitter'),
    redis = require('redis'),
    cf = require('./cloudfoundry'),
    credentials = require('./credentials.js'),
    mongodb = require('mongodb'),
    mongoclient = require('mongodb').Client;

var collection; //mongo database collection
var server = new mongodb.Server("127.0.0.1", 27017, {});

new mongodb.Db('tweets', server, {w:1}).open(function (error, client) {
  if (error){
      console.log(error);
  }
  else{
      collection = new mongodb.Collection(client, 'tweets');
      console.log('mongodb is connected!');
  }
});

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
    };

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
                                //increment count in redis db
                                client.hincrby(date, subject+keywords[0],'1', redis.print);
                                //write to the console (for testing)
                                console.log(subject + " " + keywords[0] + "\nTweet: " + tweet.text);
                                //add to the database
                                collection.insert({subject: subject, 
                                                   keyword: keywords[0], 
                                                   date: date, 
                                                   tweet: tweetString}, 
                                                  {safe:true}, 
                                        function(err, objects) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        //write to the console (for testing)
                                        console.log("the tweet was saved to the database\n" + tweetString);
                                    }
                                });
                            };

                            if(tweet.text.match(keyword2_re)) {
                                //increment count in redis db
                                client.hincrby(date, subject+keywords[1], '1', redis.print);
                                //write to the console (for testing)
                                console.log(subject + " " + keywords[1] + "\nTweet: " + tweet.text);
                                //add to the database
                                collection.insert({subject: subject, keyword: keywords[1], date: date, tweet: tweetString}, {safe:true}, function(err, objects) {
                                    if (err){
                                    console.log(err);
                                    }
                                    else{
                                    //write to the console (for testing)
                                    console.log("the tweet was saved to the database\n" + tweetString);
                                    }
                                });
                            }
                        } // if(tweet.text.match(subject))
                    }); // subjects.forEach
                }); // stream.on
                
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
    }; // track()

}

module.exports = Tracker;
