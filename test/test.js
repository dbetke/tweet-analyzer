var assert = require("assert")
  , Tracker = require("../tracker")
  , redis = require("redis")
  , should = require("should");

describe("Tracker", function() {
    describe("#track()", function() {
        it('should add counts to redis when tracking Bieber and Jesus', 
                                                             function(done) {
            var tracker = new Tracker()
              , redisClient = redis.createClient();

            this.timeout(15000);
            redisClient.flushall();
            tracker.track(["bieber", "jesus"], ["love", "hate"]);
            setTimeout(function() {
                var date = ("" + new Date().getFullYear() + "-" 
                               + (new Date().getMonth() + 1) + "-" 
                               + new Date().getDate() );

                redisClient.hgetall(date, function(err, result) {
                    if (err) throw err;
                    console.log(result);
                    should.exist(result);
                    done();
                });
            }, 5000);
       }); 
    });

});

