'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialSeed = mongoose.model('SocialSeed'),
    District = mongoose.model('District');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error/index'),
    logger = require('../../logger/index');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var getTwitterTokenAndSecret = require('../../socialmedia/controller/twitter/socialmedia.twitter.token.secret.js').getTwitterTokenAndSecret,
    twitterApiGet = require('../../socialmedia/controller/twitter/socialmedia.twitter.api.get.js').twitterApiGet;

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALSEED.UPDATE.FOLLOWER.COUNT
 * - Update follower count for district social seeds via twitter api.
 * - Run this once in a while.
 */
exports.updateFollowerCount = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Update Social Seed Follower Counts Error!',
            message: message || 'We had trouble updating the social seed follower counts. Please try again.'
        });
    }

    var oneWeekAgo = (function() { var d = new Date(); d.setDate(d.getDate()-7); return d; })();

    // get social seeds
    SocialSeed.find({
            frequency: {$in: ['hourly', 'daily', 'weekly']},
            'twitter.type': 'screen_name',
            $or: [{followerCountUpdated: {$exists: false}}, {followerCountUpdated: {$lt: oneWeekAgo}}]
        })
        .limit(100)
        .select('twitter')
        .exec(function(err, seedDocs) {
            if (err) { error.log(new Error(err)); errorMessage(); return; }
            if (!seedDocs) { error.log(new Error('!seedDocs')); errorMessage(); return; }
            if (!seedDocs.length) { res.status(200).send('No seeds need follower count updated right now.'); return; }

            // construct url
            var twitterApiUrl = 'https://api.twitter.com/1.1/users/lookup.json?screen_name=';
            seedDocs.forEach(function(seed, seedIndex) {
                if (seed && seed.twitter && seed.twitter.query && /^\@[a-zA-Z0-9\_]+$/.test(seed.twitter.query)) {
                    twitterApiUrl += (seed.twitter.query.charAt(0) === '@') ? seed.twitter.query.slice(1) : seed.twitter.query;
                    if (seedDocs[seedIndex+1]) { twitterApiUrl += ','; }
                }
            });

            // get twitter token and secret
            getTwitterTokenAndSecret(function(err, token, secret) {
                if (err) { error.log(err); errorMessage(); return; }
                if (!token) { error.log(new Error('!token')); errorMessage(); return; }
                if (!secret) { error.log(new Error('!secret')); errorMessage(); return; }

                // perform twitter api user lookup
                logger.bold(twitterApiUrl);
                twitterApiGet(twitterApiUrl, token, secret, function(err, data) {
                    if (err && err.statusCode === 404 && err.data && err.data.indexOf('No user matches for specified terms.') > -1) {
                        var seedIds = [];
                        seedDocs.forEach(function(_seed) { seedIds.push(_seed._id); });
                        SocialSeed.update(
                            {_id: {$in: seedIds}},
                            {$set: {'twitter.followerCount': 0, followerCountUpdated: new Date()}},
                            {multi: true},
                            function(err) { 
                                if (err) { error.log(new Error(err)); } 
                                console.log(seedIds);
                                console.log('updated');
                            }
                        );
                        res.status(200).send('Working on updating social seed follower counts.');
                        return;
                    }
                    if (err) {error.log(err); errorMessage(); return;}
                    if (!data) { error.log(new Error('!data')); errorMessage(); return; }
                    if (!data.length) { error.log(new Error('!data.length')); errorMessage(); return; }

                    // update social seeds
                    data.forEach(function(twUser, dataIndex) {
                        if (twUser && twUser.screen_name) {
                            SocialSeed.update(
                                {'twitter.query': '@'+twUser.screen_name.toLowerCase()},
                                {$set: {
                                    'twitter.followerCount': twUser.followers_count || 0,
                                    followerCountUpdated: new Date()
                                }},
                                function(err) {
                                    if (err) { error.log(new Error(err)); }
                                    else if (dataIndex === 0 || (dataIndex+1)%10 === 0 || dataIndex+1 === data.length) {
                                        logger.arrow('social seed updated ('+(dataIndex+1)+'/'+data.length+')');   
                                    }
                                }
                            );
                        }
                    });

                    // done
                    res.status(200).send('Working on updating social seed follower counts.');
                });
            });
        });
};