var assert = require("assert")
  , Tracker = require("../tracker")
  , redis = require("redis")
  , should = require("should");

describe("Tracker", function() {
    describe("#track()", function() {
        it('should add counts to redis when tracking Bieber and Jesus', 
                                                             function(done) {
            var tracker = new Tracker();

            this.timeout(15000);
            tracker.track(["bieber", "jesus"], ["love", "hate"]);
            setTimeout(function() {
                var redisClient = redis.createClient()
                  , date = ("" + new Date().getFullYear() + "-" 
                               + (new Date().getMonth()+1) + "-" 
                               + new Date().getDate());

                redisClient.hgetall(date, function(err, result) {
                    if (err) throw err;
                    should.exist(result);
                    done();
                });
            }, 5000);
       }); 
    });
});

