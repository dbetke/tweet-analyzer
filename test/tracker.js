process.env.NODE_ENV = 'test';

var assert = require("assert")
  , redis = require("redis")
  , should = require("should")
  , mongodb = require("mongodb")
  , mongoclient = require("mongodb").Client
  , twitter = require('immortal-ntwitter')
  , credentials = require('../credentials.js')
  , Tracker = require('../tracker');
  ;

describe("Tracker", function() {
var tracker = new Tracker();
var server = new mongodb.Server("127.0.0.1", 27017, {});
var db = 'testTweetDb';
var collection = 'testTweets';
var redisClient;

    	it('should connect to redis', function(done){
	    redisClient = redis.createClient();
	    should.exist(redisClient);
	    done();
	});

    describe("#makeDate()", function(){
	function makeDate(tweet){
	    var d = (tweet.created_at); 
	    var month = new Date(Date.parse(d)).getMonth()+1;
            var day = new Date(Date.parse(d)).getDate();
            var year = new Date(Date.parse(d)).getFullYear();
            var date = (year + "-" + month + "-" + day);
         
	    return date;
	}
	
	it('should return a reformatted date', function(){
	    var testTweet = {"created_at": "Wed Feb 13 13:47:20 +0000 2013"};
            makeDate(testTweet).should.equal('2013-2-13');
	});
	
    });//end describe makeDate

    describe("#UseCollection()", function(){
	it('should connect to mongodb', function(done){
	    tracker.UseCollection(db, collection);
	    //TODO: Add test to verify collection was created properly (how to connect to database after using method to create?)
	    done();
	});
    }); //end describe UseCollection

    describe("#track()", function(){
	var subject = ['a', 'i'];
	var keyword = ['love', 'hate'];
	var exists;

		
	it('should add counts to redis when tracking', function(done) {                                                                                                       
            this.timeout(25000);
            redisClient.flushall();
            tracker.track(subject, keyword);
            setTimeout(function() {
                var date = ("" + new Date().getFullYear() + "-" 
                               + (new Date().getMonth() + 1) + "-" 
                               + new Date().getDate() );

                redisClient.hgetall(date, function(err, result) {
                    if (err) throw err;
                    should.exist(result);
                    done();
                });
            }, 5000);                              
	});

	it('should add tweets to mongodb', function(done){
	    //TODO: add test to verify tracked tweets are being saved to mongo
	    done();
	});


	it('should use regular expressions to match keywords to tweets', function(done){
	    keyword = ["love", "hate"]
	    var testTweet1 = 'i love this test';
	    var testTweet2 = 'i hate this test';
	    var testTweet3 = 'i am indifferent about this test';
	    var keyword1_re = new RegExp("(\\s|^)" + keyword[0] + "(\\s|$)", "i");
            var keyword2_re = new RegExp("(\\s|^)" + keyword[1] + "(\\s|$)", "i");

	    //verify that the appropriate matches are made using the regex
	    if((testTweet1.match(keyword1_re)) && (testTweet2.match(keyword2_re)) && (!testTweet3.match(keyword1_re)) && (!testTweet3.match(keyword2_re))){
		done();
	    }
	    else{
		throw 'uh oh: matching problem!';
	    }

	    //TODO: Look into why the following convention will not work (times out)
	    //testTweet1.should.match(keyword1_re);
	    //testTweet2.should.match(keyword2_re);
	});

    });//end describe track

}); //end describe tracker

