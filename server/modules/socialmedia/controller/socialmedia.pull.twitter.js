'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../../../../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialSeed = mongoose.model('SocialSeed');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var socialmedia = {};
socialmedia = _.extend(socialmedia, require('./twitter/socialmedia.twitter.api.get.js'));
socialmedia = _.extend(socialmedia, require('./twitter/socialmedia.twitter.save.tweets.js'));
socialmedia = _.extend(socialmedia, require('./twitter/socialmedia.twitter.token.secret.js'));

/**
 * Get a list of twitter social seeds that should be run right now.
 * - Give priority to the social seeds with a lesser frequency.
 * @param clbk - return clbk(err, seeds)
 */
function getSeeds(clbk) {

    var seedList = {new: [], weekly: [], daily: [], hourly: []},
        oneWeekAgo = (function() {var d = new Date(); d.setDate(d.getDate()-7); return d;})(),
        oneDayAgo = (function() {var d = new Date(); d.setDate(d.getDate()-1); return d;})(),
        oneHourAgo = (function() {var d = new Date(); d.setHours(d.getHours()-1); return d;})();

    // check done
    var cnt;
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            var allSeeds = [].concat(seedList.new).concat(seedList.weekly).concat(seedList.daily).concat(seedList.hourly);
            return clbk(allSeeds);
        }
    }

    // get some seeds
    function getSomeSeeds(query, frequency) {
        SocialSeed.find(query)
            .sort({lastPull: 1})
            .exec(function(err, seedDocs) {
                if (err || !seedDocs) {error.log(new Error(err || '!seedDocs'));}
                if (seedDocs.length) {seedList[frequency] = seedDocs;}
                checkDone();
            });
    }

    // start
    if (process.env.NODE_ENV === 'development') {
        cnt = 1;
        getSomeSeeds({platform: 'twitter', frequency: {$in: ['weekly', 'daily', 'hourly']}}, 'new');
    } else {
        cnt = 4;
        getSomeSeeds({platform: 'twitter', initialized: {$exists: false}, frequency: {$in: ['weekly', 'daily', 'hourly']}}, 'new');
        getSomeSeeds({platform: 'twitter', frequency: 'weekly', lastPulled: {$lt: oneWeekAgo}}, 'weekly');
        getSomeSeeds({platform: 'twitter', frequency: 'daily', lastPulled: {$lt: oneDayAgo}}, 'daily');
        getSomeSeeds({platform: 'twitter', frequency: 'hourly', lastPulled: {$lt: oneHourAgo}}, 'hourly');
    }
}

/**
 * Get tweets from twitter.
 * - Log errors here because no clbk.
 * @param url - the url to use for getting tweets
 * @param seed - the social seed who's query is used to get the tweets
 * @param token - a user's twitter token
 * @param secret - a user's twitter secret
 */
function getTweets(url, seed, token, secret) {
    if (!url && !seed) {return error.log(new Error('!url && !seed'));}
    if (!url && !seed.query) {return error.log(new Error('!seed.query'));}
    if (!token) {return error.log(new Error('!token'));}
    if (!secret) {return error.log(new Error('!secret'));}

    var tweetCount = 100;

    // check if screen name - handled differently
    var screen_name = (seed && seed.query && seed.query.indexOf('@') === 0 && seed.query.indexOf(' ') < 0) ? seed.query : null;

    // twitter api request url
    if (!url) {
        if (screen_name) {
            url = 'https://api.twitter.com/1.1/statuses/user_timeline.json'+
                '?screen_name='+encodeURIComponent(screen_name)+
                '&count='+tweetCount;
        } else {
            url = 'https://api.twitter.com/1.1/search/tweets.json'+
                '?q='+encodeURIComponent(seed.query)+
                '&result_type=recent'+
                '&count='+tweetCount;
        }
    }

    logger.log(url);

    // get tweets from twitter
    socialmedia.twitterApiGet(url, token, secret, function(err, data) {
        if (err) {error.log(err);}
        if (!data) {error.log(new Error('!data'));}

        var now = new Date();

        // tweets
        var tweets = (screen_name) ? data : data.statuses;
        if (!tweets) {return error.log(new Error('!tweets'));}
        if (!tweets.length) {return logger.result('no tweets pulled for url=\n'+url);}

        // save tweets
        socialmedia.saveTweets(tweets, function(errs, newTweets) {
            if (errs) { errs.forEach(function(cV) { error.log(cV); }); }

            // update social seed
            if (seed) {
                SocialSeed.update(
                    {_id: seed._id},
                    {$set: {lastPulled: now}},
                    function(err) {
                        if (err) {return error.log(new Error(err));}
                    }
                );

                if (newTweets) {seed.media += newTweets;}
                seed.lastPulled = now;
                seed.history = [{date: now, total: tweets.length, new: newTweets}].concat(seed.history || []);
                if (seed.history.length > 100) {seed.history = seed.history.slice(0, 100);}
                if (!seed.initialized) {seed.initialized = now;}
                seed.save(function (err) {
                    if (err) {return error.log(new Error(err));}
                });
            }

            // go again if initializing new seed
            var fifteenMinutesAgo = (function(){var d = new Date(); d.setMinutes(d.getMinutes()-15); return d;})();
            if (seed && seed.initialized > fifteenMinutesAgo) {
                var nextUrl;
                if (screen_name && tweets[tweets.length-1] && tweets[tweets.length-1].id) {
                    nextUrl = 'https://api.twitter.com/1.1/statuses/user_timeline.json'+
                        '?screen_name='+encodeURIComponent(screen_name)+
                        '&count='+tweetCount+
                        '&max_id='+tweets[tweets.length-1].id;
                } else if (data.search_metadata && data.search_metadata.next_results) {
                    nextUrl = 'https://api.twitter.com/1.1/search/tweets.json'+data.search_metadata.next_results;
                }
                if (nextUrl) {getTweets(nextUrl, seed, token, secret);}
            }
        });
    });
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.PULL.TWITTER
 * - Pull social media from Twitter.
 * - This is performed every 15 minutes via a cron job.
 * - Twitter rate limits are based on 15 minute windows (https://dev.twitter.com/rest/public/rate-limiting)
 */
exports.pullTwitter = function(req, res) {
    logger.filename(__filename);

    var twitterWindow = 15, // 15 min window
        twitterWindowLimit = 150; // max 180 but reserve some for seed initialization requests

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Social Media Pull Error!',
            message: message || 'We had trouble pulling social media from Twitter. Please try again.'
        });
    }

    if (req.user && !req.user.twitter) {
        return errorMessage(403, 'Please go to settings and connect your Twitter account before pulling tweets.');
    }

    // get twitter token and secret
    socialmedia.getTwitterTokenAndSecret(req.user, function(err, token, secret) {
        if (err) {error.log(err); return errorMessage();}
        if (!token) {error.log(new Error('!token')); return errorMessage();}
        if (!secret) {error.log(new Error('!secret')); return errorMessage();}

        // get twitter social seeds
        getSeeds(function (seeds) {
            if (!seeds) {error.log(new Error('!seeds')); return errorMessage();}
            if (!seeds.length) {logger.result('no seeds to run right now'); return res.status(200).send('no seeds to run right now');}
            if (seeds.length > twitterWindowLimit) {seeds = seeds.slice(0, twitterWindowLimit);}

            var timeout = 0,
                timeoutInc = (process.env.SERVER === 'local') ?
                    1000 * 5 : // 5 sec delay if running locally
                    (1000 * 60 * twitterWindow) / seeds.length;

            // get tweets for each seed
            seeds.forEach(function(cV) {

                function getTweetsForThisSeed() {
                    getTweets(null, cV, token, secret);
                }

                setTimeout(getTweetsForThisSeed, timeout);
                timeout += timeoutInc;
            });

            // done
            logger.result('working on pulling tweets');
            return res.status(200).send('working on pulling tweets');
        });
    });
};