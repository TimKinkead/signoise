'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var passport = require('passport'),
	TwitterStrategy = require('passport-twitter').Strategy;

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../../../../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Strategies

/**
 * Twitter Strategy
 */
module.exports = function() {

    var twitterKey, twitterSecret;
    if (process.env.SERVER === 'local') {
        twitterKey = auth.twitterConsumerKeyDev;
        twitterSecret = auth.twitterConsumerSecretDev;
    } else {
        twitterKey = auth.twitterConsumerKey;
        twitterSecret = auth.twitterConsumerSecret;
    }

	// twitter strategy
	passport.use('twitter', new TwitterStrategy({
            consumerKey: twitterKey,
            consumerSecret: twitterSecret
        },
        function(token, secret, profile, clbk) {
            // passing object to clbk b/c multiple parameters not working -> return clbk(accessToken, profile) would pass 2nd argument as undefined.
            return clbk({
                token: token,
                secret: secret
            });
        }
	));
};
