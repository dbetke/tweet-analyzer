'use strict';
process.env.NODE_ENV = 'test';

var assert = require("assert"),
    redis = require("redis"),
    should = require("should"),
    mongodb = require("mongodb"),
    mongoclient = require("mongodb").Client,
    twitter = require('immortal-ntwitter'),
    credentials = require('../credentials.js'),
    Tracker = require('../tracker');

describe("Tracker", function () {
    var tracker = new Tracker(),
        server = new mongodb.Server("127.0.0.1", 27017, {}),
        redisClient,
        prefix,
        collection;

    it('should connect to redis', function (done) {
        redisClient = redis.createClient();
        should.exist(redisClient);
        done();
    });

    describe("#makeDate()", function () {
        function makeDate(tweet) {
            var d = (tweet.created_at),
                month = new Date(Date.parse(d)).getMonth() + 1,
                day = new Date(Date.parse(d)).getDate(),
                year = new Date(Date.parse(d)).getFullYear(),
                date = (year + "-" + month + "-" + day);

            return date;
        }

        it('should return a reformatted date', function () {
            var testTweet = {"created_at": "Wed Feb 13 13:47:20 +0000 2013"};
            makeDate(testTweet).should.equal('2013-2-13');
        });

    });//end describe makeDate

    describe("#UseCollection()", function () {
        it('should connect to mongodb', function (done) {
            collection = tracker.UseCollection('testTweetDb', 'testTweets');
	    done();
        });
    }); //end describe UseCollection

    describe("usePrefix()", function () {
        it('should set the prefix to be used in Redis', function () {
            prefix = tracker.usePrefix('MochaTest-');
            prefix.should.equal('MochaTest-');
        });
    }); //end descript usePrefix

    describe("#track()", function () {
        var subject = ['a', 'i'],
            keyword = ['love', 'hate'],
            exists,
            date;

        it('should add counts to redis and tweets to mongodb when tracking', function (done) {
            this.timeout(25000);
            tracker.track(subject, keyword);
            setTimeout(function () {
                date = (new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate());
                //return all the values associated with the key and fields
                redisClient.hmget(date, prefix + subject[0] + keyword[0], prefix + subject[0] + keyword[1], prefix + subject[1] + keyword[0], prefix + subject[1] + keyword[1], function (err, result) {
                    if (err) {
                        throw err;
                    }

                    result = result[0] + result[1] + result[2] + result[3];
                    result.should.not.equal(0);
                });

               done();
            }, 5000);
        });

	it('should return all redis counts for specified date, prefix, subject, and keyword', function () {
	    for (var sub in subject) {
		for (var key in keyword) {
		    tracker.getRedisResults(date, prefix, subject[sub], keyword[key], function (result) {
			result.should.exist;
		    });	
		}
	    }
	});

        it('should use regular expressions to match keywords to tweets', function (done) {
            keyword = ["love", "hate"];
            var testTweet1 = 'i love this test',
                testTweet2 = 'i hate this test',
                testTweet3 = "i don't care about this test",
                keyword1_re = new RegExp("(\\s|^)" + keyword[0] + "(\\s|$)", "i"),
                keyword2_re = new RegExp("(\\s|^)" + keyword[1] + "(\\s|$)", "i");

            //verify that the appropriate matches are made using the regex
            if ((testTweet1.match(keyword1_re)) && (testTweet2.match(keyword2_re)) && (!testTweet3.match(keyword1_re)) && (!testTweet3.match(keyword2_re))) {
                done();
            } else {
                throw 'uh oh: matching problem!';
            }
        });

        //CLEAR DATABASE AFTER TESTS ARE COMPLETE
        after(function (done) {
	    //remove all tests from redis
            redisClient.hdel(date, prefix + subject[0] + keyword[0]);
            redisClient.hdel(date, prefix + subject[0] + keyword[1]);
            redisClient.hdel(date, prefix + subject[1] + keyword[0]);
            redisClient.hdel(date, prefix + subject[1] + keyword[1]);
	    //delete the test database from mongo
	    tracker.removeDatabase();
            done();
        });

    });//end describe track
}); //end describe tracker

