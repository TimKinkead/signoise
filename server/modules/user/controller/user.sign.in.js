'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var passport = require('passport');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * USER.SIGN.IN
 * - Authenticate user & sign in.
 */
exports.signIn = function(req, res, next) {
	logger.filename(__filename);

    var email = req.body.email.toLowerCase(),
        password = req.body.password;

    // error message
    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Login Error!',
            message: (message) ? message : 'We had trouble logging you in. Please try again.'
        });
    }

    if (!email || !password) {return errorMessage(400, 'Please provide your email and password.');}

    // passport authentication
    passport.authenticate('local', function(err, user) {
        if (err || !user) {
            if (err.custom) {return errorMessage(err.code, err.message);}
            else {error.log(new Error(err || '!user')); return errorMessage();}
        }

        // login user
        req.login(user, function(err) {
            if (err) {error.log(new Error(err)); return errorMessage();}

            // done
            logger.result('user authenticated and logged in');
            return res.status(200).send({
                _id: user._id,
                firstName: user.firstName,
                username: user.username,
                facebookLogin: user.facebookLogin
            });
        });
    })(req, res, next);
};
