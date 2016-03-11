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

    var consumerKey = (process.env.SERVER === 'local') ? auth.twitterConsumerKeyDev : auth.twitterConsumerKey,
        consumerSecret = (process.env.SERVER === 'local') ? auth.twitterConsumerSecretDev : auth.twitterConsumerSecret;

	// twitter strategy
	passport.use('twitter', new TwitterStrategy({
            consumerKey: consumerKey,
            consumerSecret: consumerSecret
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
