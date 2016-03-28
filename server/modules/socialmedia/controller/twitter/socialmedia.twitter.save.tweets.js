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

    var errs = [],
        newTweets = 0,
        timeout = 0,
        timeoutInc = 50; // 0.05 sec delay

    // check done
    var cnt = tweets.length;
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            if (!errs.length) {errs = null;}
            return clbk(errs, newTweets);
        }
    }

    // save each tweet
    tweets.forEach(function(cV) {

        function saveThisTweet() {
            saveTweet(cV, seed, function(err, newTweet) {
                if (err) {errs.push(err);}
                if (newTweet) {newTweets += 1;}
                checkDone();
            });
        }

        // save this tweet
        setTimeout(saveThisTweet, timeout);
        timeout += timeoutInc;
    });



};