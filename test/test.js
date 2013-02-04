var assert = require("assert")
var Tracker = require("../Tracker");

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});

describe("Tracker", function() {
    describe("#makeDate()", function() {
        it('should make a valid datestamp given a tweet', function() {
            var tracker = new Tracker();
            var sampleTweet = {"created_at": "Thu Oct 21 16:02:46 +0000 2010"};
            assert.equal("2010-10-21", tracker.makeDate(sampleTweet));
        });
    });
});
