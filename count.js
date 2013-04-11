var redis = require('redis');

var client = redis.createClient();

// counts the total of all values in (field)
// that are fields of the keys that match (expr)
exports.count = function(expr, field, callback) {
        console.log('Counting ' + field + ' for ' + expr);

        // get the keys, and handle them
        client.keys(expr, function(err, keys) {
                if (err) {
                        console.log(err);
                        process.exit(1);
                }
                
                // function called to recourse through each key
                var recFunction = function(keys, field, count, index, err, callback) {
                        // get value for that key
                        client.hget(keys[index], field, function(err, result) {
                                // count.push(result);
                                // console.log(result);

                                // make sure it's a number (ie the field exists)
                                var testNum = parseInt(result);
                                if (isNaN(testNum)) {
                                        console.log('Field not found');
                                        callback(0);
                                }

                                // sum it into (count)
                                count += parseInt(result);

                                // stop when we hit the end
                                if(keys.length-1 === index) {
                                        callback(count);
                                } else {
                                        recFunction(keys, field, count, index+1, err, callback);
                                }
                        });//-client.hget()
                }//-recfunction

                // invoke recFunction() with our info
                var count = 0;  // stores the count-so-far
                recFunction(keys, field, count, 0, null, function(totCount) {
                        callback(totCount);
                });
        });//-client.keys()

}//-countField