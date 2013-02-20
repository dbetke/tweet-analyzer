var assert = require('assert'),
    ping   = require('ping');


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
