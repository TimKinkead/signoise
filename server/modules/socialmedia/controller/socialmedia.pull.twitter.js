'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash'),
    request = require('request');

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../../../../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialSeed = mongoose.model('SocialSeed'),
    Summary = mongoose.model('Summary');

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
 * @param clbk - return clbk(errs, seeds)
 */
function getSeeds(clbk) {

    var maxSeeds = 180, // maximum 180 twitter requests per 15min window
        seedList = [],
        errs = [],

        oneWeekAgo = (function() {var d = new Date(); d.setDate(d.getDate()-7); return d;})(),
        oneDayAgo = (function() {var d = new Date(); d.setDate(d.getDate()-1); return d;})(),
        oneHourAgo = (function() {var d = new Date(); d.setHours(d.getHours()-1); return d;})(),

        queryIndex = 0,
        queries = [
            {platform: 'twitter', initialized: {$exists: false}, frequency: {$in: ['weekly', 'daily', 'hourly']}}, // new
            {platform: 'twitter', frequency: 'weekly', lastPulled: {$lt: oneWeekAgo}}, // weekly
            {platform: 'twitter', frequency: 'daily', lastPulled: {$lt: oneDayAgo}}, // daily
            {platform: 'twitter', frequency: 'hourly', lastPulled: {$lt: oneHourAgo}} // hourly
        ];

    // get some seeds
    function getSomeSeeds() {
        var query = queries[queryIndex],
            sort = (query.lastPulled) ? {lastPulled: 1} : {created: 1};
        SocialSeed.find(query)
            .sort(sort)
            .limit(maxSeeds)
            .exec(function(err, seedDocs) {
                if (err) {errs.push(new Error(err));}
                if (!seedDocs) {errs.push(new Error('!seedDocs'));}
                if (seedDocs && seedDocs.length) { seedList = seedList.concat(seedDocs); }
                
                queryIndex++;
                if (queries[queryIndex] && seedList.length < maxSeeds) {
                    getSomeSeeds();
                } else {
                    if (!errs.length) {errs = null;}
                    if (seedList.length > maxSeeds) { seedList = seedList.slice(0, maxSeeds); }
                    return clbk(errs, seedList);
                }
            });
    }

    // start
    getSomeSeeds();
}

/**
 * Construct url for request to twitter api for getting tweets.
 * @param seed - social seed doc
 * @param clbk - return clbk(err, url)
 */
function constructTwitterUrl(seed, clbk) {
    if (!seed) {return clbk(new Error('!seed'));}
    if (!seed.twitter) { return clbk(new Error('!seed.twitter')); }

    var url,
        tweetCount = 100,
        qLengthLimit = 500, // q=encodeURIComponent(commonTerms) must be < 500 characters (science & assessment not included)
        commonTerms = [
            '"common core"', '"common core standards"', '"state standards"', '"core standards"', '"content standards"',
            '"common core english"', '"common core math"', '"common core science"',
            '"california common core"', '"california standards"', '"california state standards"',
            'school', 'schools', 'student', 'students', 'teacher', 'teachers', 'teaching', 'education', 'classroom'
        ];

    // construct url
    switch(seed.twitter.type) {

        case 'screen_name':
            if (!seed.twitter.query) { return clbk(new Error('!seed.twitter.query')); }
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
            } else {
                return clbk(new Error('!seed.twitter.query && (!seed.twitter.latitude || !seed.twitter.longitude || !seed.twitter.radius)'));
            }
            url += '&result_type=recent&count='+tweetCount;
    }

    // done
    return clbk(null, url);
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.PULL.TWITTER
 * - Pull social media from Twitter.
 * - This is performed every 15 minutes via a cron job on the 'Node.js Background Process' production server.
 * - Twitter rate limits are based on 15 minute windows (https://dev.twitter.com/rest/public/rate-limiting)
 */
exports.pullTwitter = function(req, res) {
    logger.filename(__filename);

    // respond to client
    logger.bold('Working on pulling tweets.');
    res.status(200).send('Working on pulling tweets.');
    
    var twitterWindow = 15, // 15 min window
        requestLimit = 180, // max 180 requests per 15min window

        seedIndex = 0,
        stopTime = (function() { var d = new Date(); d.setMinutes(d.getMinutes()+twitterWindow); return d; })(),
        requestCount = 0;

    Summary.create(
        {type: 'start pulling tweets'},
        function(err, newSummaryDoc) {
            if (err) { error.log(new Error(err)); }
            if (!newSummaryDoc) { error.log(new Error('!newSummaryDoc')); }
        }
    );
    
    // get twitter token and secret
    logger.dash('getting token and secret');
    socialmedia.getTwitterTokenAndSecret(req.user, function(err, token, secret) {
        if (err) { error.log(err); return; }
        if (!token) { error.log(new Error('!token')); return; }
        if (!secret) { error.log(new Error('!secret')); return; }

        // get twitter social seeds
        logger.dash('getting social seeds');
        getSeeds(function (errs, seeds) {
            if (errs && errs.length) { errs.forEach(function(cV) { error.log(cV); }); }
            if (!seeds) { error.log(new Error('!seeds')); return; }
            if (!seeds.length) { logger.result('no seeds to run right now'); return;}
            logger.arrow(seeds.length+' social seeds');

            /**
             * For a single seed, get tweets and save them.
             * - When done, proceed to the next seed.
             */
            function getAndSaveTweetsForSeed() {
                
                var seed = seeds[seedIndex],
                    newSeed = Boolean(!seed.initialized),
                    now = new Date();

                logger.bold('seed '+(seedIndex+1)+' - '+seed.title+'\nnewSeed = '+newSeed+'\nrequestCount = '+requestCount);
                
                // next seed
                function nextSeed(delayMinutes) {
                    seedIndex++;
                    if (seeds[seedIndex] && now < stopTime && requestCount < requestLimit) {
                        if (delayMinutes) {
                            setTimeout(function() { getAndSaveTweetsForSeed(); }, 1000*60*delayMinutes);
                        } else {
                            getAndSaveTweetsForSeed();
                        }
                    } else {
                        logger.bold('done pulling tweets');
                        Summary.create(
                            {type: 'done pulling tweets', data: {totalSeeds: seeds.length, seedIndexAtFinish: seedIndex}},
                            function(err, newSummaryDoc) {
                                if (err) { error.log(new Error(err)); }
                                if (!newSummaryDoc) { error.log(new Error('!newSummaryDoc')); }
                            }
                        );
                    }
                }

                // seed error
                function seedError(e) {
                    e.seed = seed;
                    error.log(e);
                }

                // get and save tweets
                var tweetCount = 100;
                function getAndSaveTweets(url) {
                    var nextUrl = null;
                    
                    // get tweets
                    logger.dash('getting tweets for url = \n'+url);
                    requestCount++;
                    socialmedia.twitterApiGet(url, token, secret, function(err, data) {
                        if (err) { seedError(err); nextSeed(1); return; }
                        if (!data) { seedError(new Error('!data')); nextSeed(1); return; }

                        // tweets
                        var tweets = (data.statuses) ? data.statuses : data;
                        if (!tweets) { seedError(new Error('!tweets')); nextSeed(1); return; }
                        if (!tweets.length) { logger.arrow('no tweets'); nextSeed(); return; }
                        logger.arrow(tweets.length + ' tweets');

                        // save tweets
                        logger.dash('saving tweets');
                        socialmedia.saveTweets(tweets, seed, function(errs, newTweets) {
                            if (errs) { errs.forEach(function(cV) { error.log(cV); }); }
                            logger.arrow(newTweets+' new tweets');

                            // update social seed
                            if (!seed.initialized) { seed.initialized = now; }
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
                                    if (err) { error.log(new Error(err)); }
                                    else { logger.arrow('seed updated'); }
                                    
                                    // construct next url if initializing new seed
                                    if (newSeed || seed.media < 100) {
                                        if (seed.twitter && seed.twitter.query && seed.twitter.type === 'screen_name' && tweets[tweets.length-1] && tweets[tweets.length-1].id) {
                                            nextUrl = 'https://api.twitter.com/1.1/statuses/user_timeline.json'+
                                                '?screen_name='+encodeURIComponent(seed.twitter.query)+
                                                '&count='+tweetCount+
                                                '&max_id='+tweets[tweets.length-1].id;
                                        } else if (data.search_metadata && data.search_metadata.next_results) {
                                            nextUrl = 'https://api.twitter.com/1.1/search/tweets.json'+data.search_metadata.next_results;
                                        }
                                    }

                                    // go again if next url
                                    if (nextUrl && nextUrl !== url) {
                                        logger.bold('going again');
                                        getAndSaveTweets(nextUrl);
                                        return;
                                    }

                                    // otherwise get tweets for next seed
                                    nextSeed();
                                }
                            );
                        });
                    });
                }

                // start by constructing twitter api request url for seed
                constructTwitterUrl(seed, function(err, url) {
                    if (err) { seedError(err); nextSeed(); return; }
                    if (!url) { seedError(new Error('!url')); nextSeed(); return; }
                    getAndSaveTweets(url);
                });
            }

            // start pulling tweets
            getAndSaveTweetsForSeed();
        });
    });
};