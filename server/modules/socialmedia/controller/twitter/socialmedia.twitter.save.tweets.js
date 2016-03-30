'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logger = require('../../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var saveTweet = require('./socialmedia.twitter.save.tweet.js').saveTweet;

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.TWITTER.SAVE.TWEETS
 * - Save tweets to socialmedia mongodb collection.
 * - Use setTimeout to spread out saving tweets to avoid mongodb duplicate key errors.
 * @param tweets - an array of tweet objects
 * @param seed - the social seed used to pull the social media (optional)
 * @param clbk - return clbk(errs, newTweets)
 */
exports.saveTweets = function(tweets, seed, clbk) {
    //logger.filename(__filename);
    
    if (!tweets) {return clbk([new Error('!tweets')]);}
    if (!tweets.length) {return clbk(null, 0);}

    // handle optional seed parameter
    if (!clbk) { clbk = seed; seed = null; }

    var tweetIndex = 0,
        newTweets = 0,
        errs = [];

    // save each tweet
    function saveATweet() {

        function nextTweet() {
            tweetIndex++;
            if (tweets[tweetIndex]) {
                saveATweet();
            } else {
                if (!errs.length) {errs = null;}
                return clbk(errs, newTweets);
            }
        }

        var tweet = tweets[tweetIndex];
        saveTweet(tweet, seed, function(err, newTweet) {
            if (err) {errs.push(err);}
            if (newTweet) {newTweets += 1;}
            nextTweet();
        });
    }

    // start
    saveATweet();
};