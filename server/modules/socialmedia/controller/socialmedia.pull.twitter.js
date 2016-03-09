'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var OAuth = require('oauth');

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../../../../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    SocialSeed = mongoose.model('SocialSeed'),
    Page = mongoose.model('Page'),
    Site = mongoose.model('Site'),
    User = mongoose.model('User');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Get a twitter token and secret from current user or any user.
 * @param user - the current user (req.user)
 * @param clbk - return clbk(err, token, secret)
 */
function getTokenAndSecret(user, clbk) {

    // check current user
    if (user && user.twitterToken && user.twitterSecret) {
        return clbk(null, user.twitterToken, user.twitterSecret);
    }

    // get users with twitter token and secret
    User.find({twitterToken: {$exists: true}, twitterSecret: {$exists: true}})
        .select('twitterToken twitterSecret')
        .exec(function (err, userDocs) {
            if (err || !userDocs) {return clbk(new Error(err || '!userDocs'));}
            if (!userDocs.length) {return clbk(new Error('!userDocs.length'));}

            // pick a user and grab their token and secret
            var random = Math.floor(Math.random() * userDocs.length);
            user = userDocs[random];

            // done
            return clbk(null, user.twitterToken, user.twitterSecret);
        });
}

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
    var cnt = 4;
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            var allSeeds = [].concat(seedList.new).concat(seedList.weekly).concat(seedList.daily).concat(seedList.hourly);
            return clbk(allSeeds);
        }
    }

    // get seeds
    function getSeeds(query, frequency) {
        SocialSeed.find(query)
            .sort({lastPull: 1})
            .exec(function(err, seedDocs) {
                if (err || !seedDocs) {error.log(new Error(err || '!seedDocs'));}
                if (seedDocs.length) {seedList[frequency] = seedDocs;}
                checkDone();
            });
    }

    // (1) get new seeds
    getSeeds({platform: 'twitter', initialized: {$exists: false}, frequency: {$in: ['weekly', 'daily', 'hourly']}}, 'new');
    // (2) get weekly seeds
    getSeeds({platform: 'twitter', frequency: 'weekly', lastPulled: {$lt: oneWeekAgo}}, 'weekly');
    // (3) get daily seeds
    getSeeds({platform: 'twitter', frequency: 'daily', lastPulled: {$lt: oneDayAgo}}, 'daily');
    // (4) get hourly seeds
    getSeeds({platform: 'twitter', frequency: 'hourly', lastPulled: {$lt: oneHourAgo}}, 'hourly');
}

/**
 * Save a potential social seed based on tweet information.
 * @param query - the query string for the social seed
 */
function saveSeed(query) {
    if (!query) {return error.log(new Error('!query'));}

    // check if seed already exists in mongodb
    SocialSeed.findOne({platform: 'twitter', query: query}, function(err, seedDoc) {
        if (err) {return error.log(new Error(err));}
        if (seedDoc) {

            // update seed doc
            SocialSeed.update({_id: seedDoc._id}, {$inc: {references: 1}}, function(err) {
                if (err) {error.log(new Error(err));}
            });

        } else {

            // create new seed
            SocialSeed.create({platform: 'twitter', query: query, references: 1}, function(err, newSeedDoc) {
                if (err || !newSeedDoc) {error.log(new Error(err || '!newSeedDoc'));}
            });
        }
    });
}

/**
 * Save a potential web page based on tweet information.
 * @param url - the url of a tweeted link
 */
function savePage(url) {
    if (!url) {return error.log(new Error('!url'));}

    // check if page already exists in mongodb
    Page.findOne({url: url}, function(err, pageDoc) {
        if (err) {return error.log(new Error(err));}
        if (pageDoc) {

            // update page doc
            Page.update(
                {_id: pageDoc._id},
                {$inc: {referencesSocialMedia: 1}},
                function(err) {if (err) {error.log(new Error(err));}}
            );

        } else {

            // find or create new site
            Site.findOrCreate(url, function(err, siteDoc) {
                if (err || !siteDoc) {return error.log(new Error(err || '!siteDoc'));}

                // create new page
                Page.create({url: url, site: siteDoc._id, referencesSocialMedia: 1}, function(err, newPageDoc) {
                    if (err || !newPageDoc) {error.log(new Error(err || '!newPageDoc'));}
                });
            });
        }
    });
}

/**
 * Save a tweet to the mongodb social media collection.
 * @param tweet - the tweet object from twitter
 * @param clbk - return clbk(newTweet)
 */
function saveTweet(tweet, clbk) {
    if (!tweet) {return error.log(new Error('!tweet'));}

    // check if tweet already exists in mongodb
    SocialMedia.findOne({platform: 'twitter', 'data.id': tweet.id}, function(err, mediaDoc) {
        if (err) {error.log(new Error(err)); return clbk();}
        if (mediaDoc) { // update tweet data
            SocialMedia.update(
                {_id: mediaDoc._id},
                {$set: {data: tweet, modified: new Date()}},
                function(err) {if (err) {error.log(new Error(err));}}
            );
            return clbk(false);
        }

        // save new tweet
        SocialMedia.create({platform: 'twitter', data: tweet}, function(err, newMediaDoc) {
            if (err || !newMediaDoc) {error.log(new Error(err || '!newMediaDoc')); return clbk();}

            // save potential new seeds & web pages
            var i, x,
                timeout, timeoutInc = 1000,
                hashtags = (tweet.entities && tweet.entities.hashtags) ? tweet.entities.hashtags : [],
                user_mentions = (tweet.entities && tweet.entities.user_mentions) ? tweet.entities.user_mentions : [],
                urls = (tweet.entities && tweet.entities.urls) ? tweet.entities.urls : [];

            // hashtags
            timeout = 0;
            for (i=0, x=hashtags.length; i<x; i++) {
                if (hashtags[i].text) {
                    setTimeout(saveSeed('#'+hashtags[i].text.toLowerCase()), timeout);
                    timeout += timeoutInc;
                }
            }

            // accounts
            timeout = 0;
            for (i=0, x=user_mentions.length; i<x; i++) {
                if (user_mentions[i].screen_name) {
                    setTimeout(saveSeed('@'+user_mentions[i].screen_name.toLowerCase()), timeout);
                    timeout += timeoutInc;
                }
            }

            // web pages
            timeout = 0;
            for (i=0, x=urls.length; i<x; i++) {
                if (urls[i].expanded_url) {
                    setTimeout(savePage(urls[i].expanded_url.toLowerCase()), timeout);
                    timeout += timeoutInc;
                }
            }


            // done
            return clbk(true);
        });
    });
}

/**
 * Get tweets from twitter.
 * @param seed - the social seed who's query is used to get the tweets
 * @param url - the url to use for getting tweets
 * @param token - a user's twitter token
 * @param secret - a user's twitter secret
 */
function getTweets(seed, url, token, secret) {

    if (!seed) {return error.log(new Error('!seed'));}
    if (!seed.query) {return error.log(new Error('!seed.query'));}
    if (!token) {return error.log(new Error('!token'));}
    if (!secret) {return error.log(new Error('!secret'));}

    // twitter api request url
    if (!url) {url = 'https://api.twitter.com/1.1/search/tweets.json?q='+encodeURIComponent(seed.query)+'&result_type=recent&count=100';}

    // oauth setup
    // - http://webapplog.com/node-js-oauth1-0-and-oauth2-0-twitter-api-v1-1-examples/
    // - http://webapplog.com/intro-to-oauth-with-node-js-oauth-1-0/
    var consumerKey = (process.env.SERVER === 'local') ? auth.twitterConsumerKeyDev : auth.twitterConsumerKey,
        consumerSecret = (process.env.SERVER === 'local') ? auth.twitterConsumerSecretDev : auth.twitterConsumerSecret,
        oauth = new OAuth.OAuth(
            'https://api.twitter.com/oauth/request_token',
            'https://api.twitter.com/oauth/access_token',
            consumerKey,
            consumerSecret,
            '1.0A',
            null,
            'HMAC-SHA1'
        );

    // get tweets from twitter
    oauth.get(url, token, secret, function(err, data, response) {
        if (err || !data) {return error.log(new Error(err || '!data'));}

        // json parse data
        try {data = JSON.parse(data);}
        catch (e) {return error.log(new Error(e || 'JSON.parse error!'));}

        var tweets = data.statuses;
        if (!tweets) {return error.log(new Error('!tweets'));}
        if (!tweets.length) {logger.result('no tweets'); return;}

        // check done
        var cnt = tweets.length,
            newTweets = 0;
        function checkDone() {
            cnt -= 1;
            if (cnt === 0) {

                // update seed
                seed.lastPulled = new Date();
                seed.media += newTweets;
                seed.history = [{date: new Date(), total: tweets.length, new: newTweets}].concat(seed.history);
                if (seed.history.length > 100) {seed.history = seed.history.slice(0, 100);}
                if (!seed.initialized) {seed.initialized = new Date();}
                seed.save(function(err) {
                    if (err) {error.log(new Error(err));}

                    // go again if initializing new seed
                    var fifteenMinutesAgo = (function(){var d = new Date(); d.setMinutes(d.getMinutes()-15); return d;})();
                    if (seed.initialized > fifteenMinutesAgo && data.search_metadata && data.search_metadata.next_results) {
                        setTimeout(getTweets(seed, 'https://api.twitter.com/1.1/search/tweets.json'+data.search_metadata.next_results, token, secret), 1000*30); // 30 sec delay
                    }
                });
            }
        }

        function saveTweetClbk(newTweet) {
            if (newTweet) {newTweets += 1;}
            checkDone();
        }

        // save tweets
        var timeout = 0,
            timeoutInc = 1000; // 1 sec delay
        for (var i=0, x=tweets.length; i<x; i++) {
            setTimeout(saveTweet(tweets[i], saveTweetClbk), timeout);
            timeout += timeoutInc;
        }
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
        twitterWindowLimit = 150; // max 180 but reserve some for seed initialization

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
    getTokenAndSecret(req.user, function(err, token, secret) {
        if (err) {error.log(new Error(err)); return errorMessage();}
        if (!token) {error.log(new Error('!token')); return errorMessage();}
        if (!secret) {error.log(new Error('!secret')); return errorMessage();}

        // get twitter social seeds
        getSeeds(function (seeds) {
            if (!seeds) {error.log(new Error('!seeds')); return errorMessage();}
            if (!seeds.length) {return errorMessage(500, 'no seeds to run right now');}
            if (seeds.length > twitterWindowLimit) {seeds = seeds.slice(0, twitterWindowLimit);}

            // get tweets
            var timeout = 0,
                timeoutInc = (1000 * 60 * twitterWindow) / seeds.length; // spread requests over twitter window
            for (var i=0, x=seeds.length; i<x; i++) {
                setTimeout(getTweets(seeds[i], null, token, secret), timeout);
                timeout += timeoutInc;
            }

            // done
            logger.result('working on pulling tweets');
            return res.status(200).send('working on pulling tweets');
        });
    });
};