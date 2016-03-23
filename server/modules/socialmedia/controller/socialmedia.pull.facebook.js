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
    SocialSeed = mongoose.model('SocialSeed'),
    User = mongoose.model('User');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var socialmedia = {};
socialmedia = _.extend(socialmedia, require('./facebook/socialmedia.facebook.api.get.js'));
socialmedia = _.extend(socialmedia, require('./facebook/socialmedia.facebook.save.post.js'));
socialmedia = _.extend(socialmedia, require('./facebook/socialmedia.facebook.save.posts.js'));
socialmedia = _.extend(socialmedia, require('./facebook/socialmedia.facebook.token.js'));

/**
 * Get a list of facebook social seeds that should be run right now.
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
        getSomeSeeds({platform: 'facebook', frequency: {$in: ['weekly', 'daily', 'hourly']}}, 'new');
    } else {
        cnt = 4;
        getSomeSeeds({platform: 'facebook', initialized: {$exists: false}, frequency: {$in: ['weekly', 'daily', 'hourly']}}, 'new');
        getSomeSeeds({platform: 'facebook', frequency: 'weekly', lastPulled: {$lt: oneWeekAgo}}, 'weekly');
        getSomeSeeds({platform: 'facebook', frequency: 'daily', lastPulled: {$lt: oneDayAgo}}, 'daily');
        getSomeSeeds({platform: 'facebook', frequency: 'hourly', lastPulled: {$lt: oneHourAgo}}, 'hourly');
    }
}

/**
 * Get posts from facebook.
 * - Log errors here because no clbk.
 * @param url - the url to use for getting posts
 * @param seed - the social seed who's query is used to get the posts
 * @param token - a user's facebook token
 */
function getPosts(url, seed, token) {
    if (!url && !seed) {return error.log(new Error('!url && !seed'));}
    if (!url && !seed.facebook) {return error.log(new Error('!seed.facebook'));}
    if (!url && !seed.facebook.id) {return error.log(new Error('!seed.facebook.id'));}
    if (!token) {return error.log(new Error('!token'));}

    // facebook api request url
    if (!url) {
        url = 'https://graph.facebook.com/v2.5/'+seed.facebook.id+
            '?access_token='+token+
            '&fields=feed{'+
                'id,created_time,message,from{id,name,picture},'+
                'type,'+ // type of post
                'attachments,'+ // link, photo, video (subattachments if multiple photos)
                    //'object_id,'+ // uploaded photo or video (captured by 'attachments')
                    //'link,caption,description,picture,'+ // link (captured by 'attachments')
                    //'source,properties,'+ // video (captured by 'attachments')
                'place,'+ // location (place info)
                'likes,comments.order(chronological){id,created_time,message,from{id,name,picture},attachment,comment_count}'+
            '}';
    }

    logger.log(url);

    // get posts from facebook
    socialmedia.facebookApiGet(url, function(err, data) {
        if (err) {return error.log(err);}
        if (!data) {return error.log(new Error('!data'));}

        // posts
        var posts = (data.feed && data.feed.data) ? data.feed.data : null;
        if (!posts) {return error.log(new Error('!posts'));}
        //if (!posts.length) {return logger.result('no posts pulled for url=\n'+url);}

        // save posts
        socialmedia.saveFacebookPosts(posts, seed, function(errs, newPosts) {
            if (errs) { errs.forEach(function(cV) { error.log(cV); }); }

            var now = new Date();

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
                            media: newPosts
                        },
                        $push: {history: {
                            $position: 0,
                            $each: [{date: now, total: posts.length, new: newPosts || 0}],
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
            if (seed && seed.initialized > fifteenMinutesAgo && data.paging && data.paging.next) {
                getPosts(data.paging.next, seed, token);
            }
        });
    });
}


//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.PULL.FACEBOOK
 * - Pull social media from Facebook.
 * - This is performed every 60 minutes via a cron job.
 * - Facebook rate limits are based on 60 minute windows. (https://developers.facebook.com/docs/graph-api/advanced/rate-limiting)
 */
exports.pullFacebook = function(req, res) {
    logger.filename(__filename);

    var facebookWindow = 60, // 1 hour window
        facebookWindowLimit = 150; // max 200 per user but reserve some for seed initialization

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Social Media Pull Error!',
            message: message || 'We had trouble pulling social media from Facebook. Please try again.'
        });
    }

    if (req.user && !req.user.facebook) {
        return errorMessage(403, 'Please go to settings and connect your Facebook account before pulling posts.');
    }

    // get facebook token
    socialmedia.getFacebookToken(req.user, function(err, token) {
        if (err) {error.log(err); return errorMessage();}
        if (!token) {error.log(new Error('!token')); return errorMessage();}

        // get facebook social seeds
        getSeeds(function (seeds) {
            if (!seeds) {error.log(new Error('!seeds')); return errorMessage();}
            if (!seeds.length) {logger.result('no seeds to run right now'); return res.status(200).send('no seeds to run right now');}
            if (seeds.length > facebookWindowLimit) {seeds = seeds.slice(0, facebookWindowLimit);}

            var timeout = 0,
                timeoutInc = (process.env.SERVER === 'local') ?
                    1000 * 5 : // 5 sec delay if running locally
                    (1000 * 60 * facebookWindow) / seeds.length;

            // get posts for each seed
            seeds.forEach(function(cV) {

                function getPostsForThisSeed() {
                    getPosts(null, cV, token);
                }

                setTimeout(getPostsForThisSeed, timeout);
                timeout += timeoutInc;
            });

            // done
            logger.result('working on pulling posts');
            return res.status(200).send('working on pulling posts');
        });
    });
};