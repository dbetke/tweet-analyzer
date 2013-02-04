var assert = require("assert")
var Tracker = require("../Tracker");

describe("Tracker", function() {
    describe("#makeDate()", function() {
        it('should make a valid datestamp given a tweet', function() {
            var tracker = new Tracker();
            var sampleTweet = {"created_at": "Thu Oct 21 16:02:46 +0000 2010"};
            tracker.makeDate(sampleTweet).should.equal("2010-10-21");
        });
    });
});
