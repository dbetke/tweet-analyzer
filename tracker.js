var twitter = require('immortal-ntwitter');
var redis = require('redis');
var cf = require('./cloudfoundry');
var credentials = require('./credentials.js');
var client;

function Tracker() {
    var redis_host =  cf.redis?cf.redis.credentials.host:'localhost';
    var redis_port = cf.redis?cf.redis.credentials.port:6379;
    var redis_password = cf.redis?cf.redis.credentials.password:undefined;

    client = redis.createClient(redis_port, redis_host);
    
    if(cf.runningInTheCloud) {
        client.auth(redis_password);
    }

    var t = new twitter({
        consumer_key: credentials.consumer_key,
        consumer_secret: credentials.consumer_secret,
        access_token_key: credentials.access_token_key,
        access_token_secret: credentials.access_token_secret
    });


    var makeDate = function(tweet) {
        var d = (tweet.created_at);
        var month = new Date(Date.parse(d)).getMonth()+1;
        var day = new Date(Date.parse(d)).getDate();
        var year = new Date(Date.parse(d)).getFullYear();
        var date = (year + "-" + month + "-" + day);

        return date;
    }

    this.track = function(subjects, keywords) {
        t.immortalStream(
            'statuses/filter',
            { track: subjects },
            function(stream) {
                stream.on('data', function(tweet) {
                    var date = makeDate(tweet);
                    var keyword1_re = new RegExp("(\\s|^)" + keywords[0] + "(\\s|$)", "i"); 
                    var keyword2_re = new RegExp("(\\s|^)" + keywords[1] + "(\\s|$)", "i"); 

                    subjects.forEach(function(subject) {
                        if(tweet.text.match(subject)) {
                            if(tweet.text.match(keyword1_re)) {
                                client.hincrby(date, subject+keywords[0],'1', redis.print);
                                console.log(subject + " " + keywords[0] + " : \n" + tweet.text); 
                            }
              
                            if(tweet.text.match(keyword2_re)) {
                                client.hincrby(date, subject+keywords[1], '1', redis.print);
                                console.log(subject + " " + keywords[1] + " : \n" + tweet.text); 
                            }
                        }
                    });
                });
                
                stream.on('error', function (err) {
                    console.log(err);
                });

                stream.on('end', function (response) {
                    console.log('end event fired!');
                    console.log(response);
                });

                stream.on('destroy', function (response) {
                    console.log('destroy event fired!');
                    console.log(response);
                });

            } // f(stream)
        ); // t.immortalStream
    } // track()
}

module.exports = Tracker;
