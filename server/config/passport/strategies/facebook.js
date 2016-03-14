'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy;

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../../../../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Facebook Passport Strategy
 * - Sign Up / Login with Facebook
 */
module.exports = function() {

    var clientID = (process.env.SERVER === 'local') ? auth.facebookAppIdDev : auth.facebookAppId,
        clientSecret = (process.env.SERVER === 'local') ? auth.facebookAppSecretDev : auth.facebookAppSecret;

	passport.use(
        'facebook',
        new FacebookStrategy({clientID: clientID, clientSecret: clientSecret},
        function(accessToken, refreshToken, profile, clbk) {
            // passing object to clbk b/c multiple parameters not working
            // - return clbk(accessToken, profile) would pass 2nd argument as undefined
            // - facebook doesn't support refreshToken - https://github.com/jaredhanson/passport-facebook/issues/8
            return clbk({accessToken: accessToken});
        }
	));

};
