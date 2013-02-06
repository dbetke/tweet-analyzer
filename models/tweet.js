var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TweetSchema = new Schema ({
	subject :  String, //the subject being tracked
	keyword :  String, //the sentiment keyword being tracked
	date    :  String, //using date created by makeDate function
	tweet   :  String  //storing json object to string
	
});

var Tweet = mongoose.model('Tweet', TweetSchema); //model name, schema being used
module.exports = Tweet; //allow access to the tweet model