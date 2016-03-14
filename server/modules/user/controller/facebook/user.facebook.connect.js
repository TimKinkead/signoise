'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var passport = require('passport');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../../error'),
    logger = require('../../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * USER.FACEBOOK.CONNECT
 * - Passport authentication after Facebook app authorization and redirect back to site.
 * - Save facebook access token to user doc.
 */
exports.facebookConnect = function(req, res, next) {
    logger.filename(__filename);

    function errorMessage(message) {
        return res.redirect(
            req.protocol+'://'+req.get('host')+
            '?header=Facebook Connection Error!'+
            '&message=We had trouble connecting your Facebook account. Please try again.'
        );
    }

    if (!req.user) {return errorMessage();}

    // passport authentication
    // - callbackURL must match the callbackURL in './user.facebook.authorization'
    passport.authenticate(
        'facebook',
        {callbackURL: req.protocol+'://'+req.get('host')+req.path},
        function(facebookData) {
            if (!facebookData || !facebookData.accessToken) {return errorMessage();}

            // save facebook access token to user doc
            req.user.facebookAccessToken = facebookData.accessToken;
            req.user.save(function(err) {
                if (err) {error.log(new Error(err)); return errorMessage();}

                // done
                return res.redirect(
                    req.protocol+'://'+req.get('host')+'/dashboard'+
                    '?header=Facebook Connected!'+
                    '&message=Your Facebook account has been connected.'
                );
            });
        }
    )(req, res, next);
};
