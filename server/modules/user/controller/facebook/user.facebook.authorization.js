'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var passport = require('passport');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logger = require('../../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * USER.FACEBOOK.AUTHORIZATION
 * - Redirect to Facebook for app authorization.
 * - Facebook redirects to callbackURL after authorization.
 */
exports.facebookAuthorization = function(req, res, next) {
    logger.filename(__filename);

    // passport authentication for facebook
    // - redirects to facebook for authorization
    // - appends 2nd arg to 'FacebookStrategy' defined in 'server/config/passport/strategies/facebook.js'
    passport.authenticate(
        'facebook',
        {callbackURL: req.protocol+'://'+req.get('host')+req.path+'/clbk'}
    )(req, res, next);
};
