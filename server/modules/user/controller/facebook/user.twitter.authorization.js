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
 * USER.TWITTER.AUTHORIZATION
 * - Redirect to Twitter for app authorization.
 * - Twitter redirects to callbackURL after authorization.
 */
exports.twitterAuthorization = function(req, res, next) {
    logger.filename(__filename);

    /*if (process.env.SERVER === 'local' && req.get('host').indexOf('localhost') > -1) {
        var url = 'http://127.0.0.1:'+process.env.PORT;
        return res.status(400).send({
            header: 'Twitter doesn\'t play nice with \'localhost\'.',
            message: 'Try again from <a href="'+url+'">'+url+'</a>.'
        });
    }*/

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    //res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // passport authentication for twitter
    // - redirects to twitter for authorization
    // - appends 2nd arg to 'TwitterStrategy' defined in 'server/config/passport/strategies/twitter.js'
    passport.authenticate(
        'twitter',
        {callbackURL: req.protocol+'://'+req.get('host')+req.path+'/clbk'}
    )(req, res, next);
};
