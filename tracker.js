'use strict';

var Twitter = require('immortal-ntwitter'),
    redis = require('redis'),
    cf = require('./cloudfoundry'),
    credentials = require('./credentials.js'),
    mongodb = require('mongodb'),
    mongoclient = require('mongodb').Client;

function Tracker() {
    var self = this,
        client,
        collection, //mongo database collection
        prefix,
        server = new mongodb.Server("127.0.0.1", 27017, {}),
        mongoClient,
        redis_host =  cf.redis ? cf.redis.credentials.host : 'localhost',
        redis_port = cf.redis ? cf.redis.credentials.port : 6379,
        redis_password = cf.redis ? cf.redis.credentials.password : undefined,
        t = new Twitter({
            consumer_key: credentials.consumer_key,
            consumer_secret: credentials.consumer_secret,
            access_token_key: credentials.access_token_key,
            access_token_secret: credentials.access_token_secret
        }),
        makeDate = function (tweet) {
            var d = (tweet.created_at),
                month = new Date(Date.parse(d)).getMonth() + 1,
                day = new Date(Date.parse(d)).getDate(),
                year = new Date(Date.parse(d)).getFullYear(),
                date = (year + "-" + month + "-" + day);

            return date;
        };

    client = redis.createClient(redis_port, redis_host);

    if (cf.runningInTheCloud) {
        client.auth(redis_password);
    }

    this.UseCollection = function (dbName, collectionName) {
        mongoClient = new mongodb.Db(dbName, server, {w: 1});
	mongoClient.open(function (error, client) {
            if (error) {
                throw error;
            } else {
                collection = new mongodb.Collection(client, collectionName);
                console.log('mongodb is connected!');
            }
        });
    };

    this.removeDatabase = function () {
	mongoClient.dropDatabase();
    }

    this.usePrefix = function (pre) {
	prefix = pre;
        return prefix;
    };

    this.track = function (subjects, keywords) {
        t.immortalStream(
            'statuses/filter',
            { track: subjects },
            function (stream) {
                self.destroy = function() {
                    stream.destroy();
                };

                stream.on('data', function (tweet) {
                    if (tweet.text === undefined) {
                        // data received is not actually a tweet
                        return;
                    }

                    var date = makeDate(tweet),
                        tweetString = JSON.stringify(tweet); //convert object to string for storage

                    subjects.forEach(function (subject) {
                        if (tweet.text.match(subject)) {
			    for (var keyword in keywords) {
				var keyword_re = new RegExp("(\\s|^)" + keywords[keyword] + "(\\s|$)", "i");

				if (tweet.text.match(keyword_re)) {
                                    //increment count in redis db
                                    client.hincrby(date, prefix + subject + keywords[keyword], '1', redis.print);
                                    
                                    //add to the database
                                    collection.insert({subject : subject, keyword : keywords[keyword], date : date, tweet : tweetString}, {safe : true}, function (err, objects) {
					if (err) {
                                            console.log(err);
					}
                                    });

				    //write to the console (for testing)
                                    //console.log(subject + " " + keywords[keyword] + "\nTweet: " + tweet.text);
				}
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
    }; // track()

    this.getRedisResults = function (dt, pre, sub, key, callback) {
	client.hget(dt, pre + sub + key, function (err, result) {
            if (err) {
                return callback(err);
            } else {
		return callback(result);
	    }
        });
    };

}

module.exports = Tracker;
