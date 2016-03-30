'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../../../../../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var OAuth = require('oauth'),
    _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logger = require('../../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.TWITTER.API.GET
 * - Perform a get request at a twitter api endpoint.
 * @param twitterUrl - twitter api request url
 * @param token - twitter user token
 * @param secret - twitter user secret
 * @param clbk - return clbk(err, data)
 */
exports.twitterApiGet = function(twitterUrl, token, secret, clbk) {
    //logger.filename(__filename);

    if (!twitterUrl) {return clbk(new Error('!twitterUrl'));}
    if (!token) {return clbk(new Error('!token'));}
    if (!secret) {return clbk(new Error('!secret'));}

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
    oauth.get(twitterUrl, token, secret, function (err, data, response) {
        if (err) {
            err = _.extend(new Error(), err);
            return clbk(err);
        }
        if (!data) {return clbk(new Error('!data'));}

        // json parse data
        try {data = JSON.parse(data);}
        catch (e) {return clbk(new Error(e || 'JSON.parse error!'));}

        // done
        return clbk(null, data);
    });
};