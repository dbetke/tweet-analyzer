process.env.NODE_ENV = 'test';

var assert = require("assert")
  , redis = require("redis")
  , should = require("should")
  , mongodb = require("mongodb")
  , mongoclient = require("mongodb").Client
  , twitter = require('immortal-ntwitter')
  , credentials = require('../credentials.js')
  ;

var t = new twitter({
    consumer_key: credentials.consumer_key,
    consumer_secret: credentials.consumer_secret,
    access_token_key: credentials.access_token_key,
    access_token_secret: credentials.access_token_secret
});

describe("Tracker", function() {

	var redisClient;
	var collection; //mongo database collection
	var server = new mongodb.Server("127.0.0.1", 27017, {});

	it('should connect to mongodb', function(done){
	    new mongodb.Db('tweets', server, {w:1}).open(function (error, client) {
		if (error) throw error;
		else{
		    collection = new mongodb.Collection(client, 'tweets_test');
		    done();
		}
	    });
	});

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


    describe("#track()", function(){

	var subject = ["a", "i"];
	var keyword;
	var exists;

	function track(subject){
	    console.log(subject);
	    t.immortalStream(
		'statuses/filter',
		{ track: subject },
		function(stream) {
                    stream.on('data', function(tweet) {
			if (tweet.text === undefined) {
                            // data received is not actually a tweet
                            return;
			}
			
			else{
			    return 'success';
			}
		    });//end stream.on
		}//end stream	
	    );//end t.immortal stream
	}//end track function

/*
	//TODO: Figure out why this test continually fails
	it('should track some tweets', function(done){
	    var result = "";
	    result = track(subject);
	    this.timeout(25000);
	    setTimeout(function(){
		if(result == 'success'){
		    done();
		}
	    }, 5000);
	});
	    
*/
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

