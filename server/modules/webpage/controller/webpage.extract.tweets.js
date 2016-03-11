'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../../../../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    WebPage = mongoose.model('WebPage');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger'),
    socialmedia = require('../../socialmedia');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * WEBPAGE.EXTRACT.TWEETS
 * - Get webpage urls that point to tweets.
 * - Get those tweets and save as social media docs.
 * - Set socialmedia flag to true for webpage docs.
 * - This is performed via cron job.
 */
exports.extractTweets = function(req, res) {
    logger.filename(__filename);

    var tweetLimit = 100; // https://dev.twitter.com/rest/reference/get/statuses/lookup

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Extract Tweets Error!',
            message: message || 'We had trouble extracting tweets from webpages. Please try again.'
        });
    }

    // get twitter webpages
    WebPage.find({domain: 'twitter.com', socialmedia: {$exists: false}})
        .exec(function(err, pageDocs) {
            if (err || !pageDocs) {error.log(new Error(err || '!pageDocs')); return errorMessage();}
            if (!pageDocs.length) {return res.status(200).send('No tweets to extract from webpages right now.');}

            var tweetRegExp = /twitter.com\/\S+\/status\/\S+/,
                tweetIds = [],
                pageIds = [],
                i = 0, x = pageDocs.length,
                url, tweetId;

            // extract tweet ids from webpages
            while (i<x && tweetIds.length < tweetLimit) {
                url = (pageDocs[i] && pageDocs[i].url) ? pageDocs[i].url : null;
                if (url && tweetRegExp.test(url)) {
                    tweetId = url.slice(url.lastIndexOf('/status/')+8);
                    if (tweetId.indexOf('/') > -1) {tweetId = tweetId.slice(0, tweetId.indexOf('/'));}
                    if (tweetIds.indexOf(tweetId) < 0) {tweetIds.push(tweetId);}
                    pageIds.push(pageDocs[i]._id);
                }
                i++;
            }

            // check tweet ids
            if (!tweetIds.length) {return res.status(200).send('No tweets to extract from webpages right now.');}

            // construct twitter request url
            url = 'https://api.twitter.com/1.1/statuses/lookup.json?id=';
            tweetIds.forEach(function(cV) {url += cV+',';});
            if (url.charAt(url.length-1) === ',') {url = url.slice(0, url.length-1);}

            // get twitter token and secret
            socialmedia.getTwitterTokenAndSecret(req.user, function(err, token, secret) {
                if (err) {error.log(err); return errorMessage();}
                if (!token) {error.log(new Error('!token')); return errorMessage();}
                if (!secret) {error.log(new Error('!secret')); return errorMessage();}

                // get tweets via twitter api request
                socialmedia.twitterApiGet(url, token, secret, function(err, tweets) {
                    if (err) {error.log(err); return errorMessage();}
                    if (!tweets) {error.log(new Error('!tweets')); return errorMessage();}

                    // save tweets
                    socialmedia.saveTweets(tweets, function(errs, newTweets) {
                        if (errs && errs.length) {
                            errs.forEach(function(cV) { error.log(cV); });
                        }
                        logger.log(newTweets+' new tweets extracted from webpages.');
                    });

                    // flag webpages as social media
                    WebPage.update(
                        {_id: {$in: pageIds}},
                        {$set: {socialmedia: true}},
                        {multi: true},
                        function(err) {
                            if (err) {error.log(new Error(err)); return errorMessage();}

                            // done
                            return res.sendStatus(200);
                        }
                    );
                });
            });
        });
};