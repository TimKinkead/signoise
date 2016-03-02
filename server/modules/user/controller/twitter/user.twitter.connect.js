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
 * USER.TWITTER.CONNECT
 * - Passport authentication after Twitter app authorization and redirect back to site.
 * - Save twitter token and secret to user doc.
 */
exports.twitterConnect = function(req, res, next) {
    logger.filename(__filename);

    function errorMessage(message) {
        return res.redirect(
            req.protocol+'://'+req.get('host')+
            '?header=Twitter Connection Error!'+
            '&message=We had trouble connecting your Twitter account. Please try again.'
        );
    }

    if (!req.user) {return errorMessage();}

    // passport authentication
    // - callbackURL must match the callbackURL in './user.twitter.authorization'
    passport.authenticate(
        'twitter',
        {callbackURL: req.protocol+'://'+req.get('host')+req.path},
        function(twitterData) {
            if (!twitterData || !twitterData.token || !twitterData.secret) {return errorMessage();}

            // save twitter token and secret to user doc
            req.user.twitterToken = twitterData.token;
            req.user.twitterSecret = twitterData.secret;
            req.user.save(function(err) {
                if (err) {error.log(new Error(err)); return errorMessage();}

                // done
                return res.redirect(
                    req.protocol+'://'+req.get('host')+
                    '?header=Twitter Connected!'+
                    '&message=Your Twitter account has been connected.'
                );
            });
        }
    )(req, res, next);
};
