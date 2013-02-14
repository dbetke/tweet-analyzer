var assert = require("assert")
  , Tracker = require("../tracker")
  , redis = require("redis")
  , should = require("should")
  , ping = require("ping")
  ;

describe("App", function() {
    it("should be able to see Twitter.com", function(done) {
        ping.sys.probe("twitter.com", function(isAlive) {
            if (isAlive) {
                done();
            } else {
                throw "Cannot connect to Twitter";
                done();
            }
        });
    });
});

describe("Tracker", function() {
    describe("#track()", function() {
        it('should add counts to redis when tracking', function(done) {
            var tracker = new Tracker()
              , redisClient = redis.createClient();

            this.timeout(15000);
            redisClient.flushall();
            tracker.track(["a"], ["love", "hate"]);
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

        it('should not add counts to tomorrow', function(done) {
            var tracker = new Tracker()
              , redisClient = redis.createClient();

            this.timeout(15000);
            redisClient.flushall();
            tracker.track(["a", "i"], ["love", "hate"]);
            setTimeout(function() {
                var date = ("" + new Date().getFullYear() + "-" 
                               + (new Date().getMonth() + 1) + "-" 
                               + (new Date().getDate()  + 1) );

                redisClient.hgetall(date, function(err, result) {
                    if (err) throw err;
                    should.not.exist(result);
                    done();
                });
            }, 5000);
        }); 

        it('should not add counts to yesterday', function(done) {
            var tracker = new Tracker()
              , redisClient = redis.createClient();

            this.timeout(15000);
            redisClient.flushall();
            tracker.track(["a", "i"], ["love", "hate"]);
            setTimeout(function() {
                var date = ("" + new Date().getFullYear() + "-" 
                               + (new Date().getMonth() + 1) + "-" 
                               + (new Date().getDate()  - 1) );

                redisClient.hgetall(date, function(err, result) {
                    if (err) throw err;
                    should.not.exist(result);
                    done();
                });
            }, 5000);
        }); 

        it.skip('should add tweet to database', function(done) {

        });
    });

});

