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
        var sort = (frequency === 'new') ? {} : {lastPulled: 1};
        SocialSeed.find(query)
            .sort(sort)
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
    if (!url && !seed.twitter) {return error.log(new Error('!seed.twitter'));}
    if (!url && !seed.twitter.query && !seed.twitter.latitude && !seed.twitter.longitude && !seed.twitter.radius) {
        return error.log(new Error('!seed.twitter.query'));
    }
    if (!url && !seed.twitter.query && (!seed.twitter.latitude || !seed.twitter.longitude || !seed.twitter.radius)) {
        return error.log(new Error('!seed.twitter.latitude || !seed.twitter.longitude || !seed.twitter.radius'));
    }
    if (!token) {return error.log(new Error('!token'));}
    if (!secret) {return error.log(new Error('!secret'));}

    var tweetCount = 100,
        qLengthLimit = 500, // q=encodeURIComponent(commonTerms) must be < 500 characters (science & assessment not included)
        commonTerms = [
            '"common core"', 'school', 'education', 'students', 'schools', 'learning', 'district', 'teachers', 'teacher',
            'student', 'policy', 'public', 'college', 'national', 'standards', 'program', 'teaching', 'research', 'lesson',
            'leadership', 'support', 'professional', 'charter', 'grade', 'development', 'community', 'board', 'read', 'programs',
            'classroom', 'children', 'science', 'assessment'
        ];

    // twitter api request url
    if (!url) {
        switch(seed.twitter.type) {
            case 'screen_name':
                url = 'https://api.twitter.com/1.1/statuses/user_timeline.json' +
                    '?screen_name=' + encodeURIComponent(seed.twitter.query) +
                    '&count=' + tweetCount;
                break;
            //case 'query':
            //case 'hashtag':
            //case 'geocode':
            default:
                url = 'https://api.twitter.com/1.1/search/tweets.json';
                if (seed.twitter.query && seed.twitter.latitude && seed.twitter.longitude && seed.twitter.radius) {
                    url += '?q='+encodeURIComponent(seed.twitter.query);
                    url += '&geocode='+encodeURIComponent(seed.twitter.latitude+','+seed.twitter.longitude+','+Math.ceil(seed.twitter.radius)+'mi');
                } else if (seed.twitter.query) {
                    url += '?q='+encodeURIComponent(seed.twitter.query);
                } else if (seed.twitter.latitude && seed.twitter.longitude && seed.twitter.radius) {
                    var qStr = commonTerms[0], // limited to 500 characters
                        i = 1;
                    while (i<commonTerms.length && encodeURIComponent(qStr+' OR '+commonTerms[i]).length < qLengthLimit) {
                        qStr += ' OR '+commonTerms[i];
                        i++;
                    }
                    url += '?q='+encodeURIComponent(qStr);
                    url += '&geocode='+seed.twitter.latitude+','+seed.twitter.longitude+','+Math.ceil(seed.twitter.radius)+'mi';
                }
                url += '&result_type=recent&count='+tweetCount;
        }
    }

    logger.log(url);

    // get tweets from twitter
    socialmedia.twitterApiGet(url, token, secret, function(err, data) {
        if (err) {return error.log(err);}
        if (!data) {return error.log(new Error('!data'));}

        var now = new Date();
        
        // tweets
        var tweets = (seed.twitter.type === 'screen_name') ? data : data.statuses;
        if (!tweets) {return error.log(new Error('!tweets'));}
        //if (!tweets.length) {return logger.result('no tweets pulled for url=\n'+url);}
        logger.result(tweets.length+' tweets');
        
        // save tweets
        socialmedia.saveTweets(tweets, seed, function(errs, newTweets) {
            if (errs) { errs.forEach(function(cV) { error.log(cV); }); }

            // update social seed
            if (seed) {
                seed.initialized = seed.initialized || now;
                SocialSeed.update(
                    {_id: seed._id},
                    {
                        $set: {
                            lastPulled: now,
                            initialized: seed.initialized
                        },
                        $inc: {
                            media: newTweets
                        },
                        $push: {history: {
                            $position: 0,
                            $each: [{date: now, total: tweets.length, new: newTweets || 0}],
                            $slice: 100
                        }}
                    }, 
                    function(err) {
                        if (err) {return error.log(new Error(err));}
                    }
                );
            }

            // go again if initializing new seed
            var fifteenMinutesAgo = (function(){var d = new Date(); d.setMinutes(d.getMinutes()-15); return d;})();
            if (seed && seed.initialized > fifteenMinutesAgo) {
                var nextUrl;
                if (seed.twitter.type === 'screen_name' && tweets[tweets.length-1] && tweets[tweets.length-1].id) {
                    nextUrl = 'https://api.twitter.com/1.1/statuses/user_timeline.json'+
                        '?screen_name='+encodeURIComponent(seed.twitter.query)+
                        '&count='+tweetCount+
                        '&max_id='+tweets[tweets.length-1].id;
                } else if (data.search_metadata && data.search_metadata.next_results) {
                    nextUrl = 'https://api.twitter.com/1.1/search/tweets.json'+data.search_metadata.next_results;
                }
                if (nextUrl) {logger.log('nextUrl = '+nextUrl); getTweets(nextUrl, seed, token, secret);}
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
            seeds.forEach(function(seed) {

                function getTweetsForThisSeed() {
                    getTweets(null, seed, token, secret);
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