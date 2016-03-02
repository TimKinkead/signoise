'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var OAuth = require('oauth'),
    he = require('he');

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../../../../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.PREVIEW.TWITTER
 * - Pull social media from Twitter for preview before creating social seed.
 */
exports.previewTwitter = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Social Media Preview Error!',
            message: message || 'We had trouble generating the Twitter preview. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to see the Twitter preview.');}
    if (!req.user.twitter) {return errorMessage(403, 'Please connect your Twitter account via settings.');}
    if (!req.query.query) {return errorMessage(400, 'Please provide a valid query string if you want to preview the social media from Twitter.');}

    // oauth setup
    // - http://webapplog.com/node-js-oauth1-0-and-oauth2-0-twitter-api-v1-1-examples/
    // - http://webapplog.com/intro-to-oauth-with-node-js-oauth-1-0/
    var twitterConsumerKey = (process.env.SERVER === 'cloud') ? auth.twitterConsumerKey : auth.twitterConsumerKeyDev,
        twitterConsumerSecret = (process.env.SERVER === 'cloud') ? auth.twitterConsumerSecret : auth.twitterConsumerSecretDev;
    console.log(twitterConsumerKey);
    console.log(twitterConsumerSecret);
    console.log(req.query.query);
    console.log(encodeURIComponent(req.query.query));
    var oauth = new OAuth.OAuth(
            'https://api.twitter.com/oauth/request_token',
            'https://api.twitter.com/oauth/access_token',
            twitterConsumerKey,
            twitterConsumerSecret,
            '1.0A',
            null,
            'HMAC-SHA1'
        ),
        url =
            'https://api.twitter.com/1.1/search/tweets.json'+
            '?q='+encodeURIComponent(req.query.query)+
            '&result_type=recent'+
            '&count=20';

    // get tweets from twitter
    console.log(url);
    console.log(req.user.twitterToken);
    console.log(req.user.twitterSecret);
    oauth.get(url, req.user.twitterToken, req.user.twitterSecret, function(err, data, response) {
        console.log(JSON.stringify(err));
        if (err || !data) {error.log(new Error(err || '!data')); return errorMessage();}
        data = JSON.parse(data);
        if (!data.statuses) {error.log(new Error('!data.statuses')); return errorMessage();}
        var tweets = data.statuses;

        // done
        logger.result('got tweets');
        return res.status(200).send(tweets);
    });
};
