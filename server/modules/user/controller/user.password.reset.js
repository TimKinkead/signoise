'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
	User = mongoose.model('User');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * USER.PASSWORD.RESET
 * - Reset password with reset token.
 */
exports.resetPassword = function(req, res, next) {
	logger.filename(__filename);

    // error message
    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Reset Password Error!',
            message: message || 'We had trouble setting your new password. Please try again.'
        });
    }

    if (!req.body.email || !req.body.code || !req.body.password) {return errorMessage(400, 'Please provide your email address, reset code, and a new password.');}

    // get user
    User.findOne({email: req.body.email.toLowerCase()})
        .exec(function(err, userDoc) {
            if (err) {error.log(new Error(err)); return errorMessage();}
            if (!userDoc) {return errorMessage(404, '<p>Sorry, we couldn\'t find an account with that email. Have you <a href="'+req.protocol+'://'+req.get('host')+'/sign-up">signed up</a> yet?</p>');}

            // check reset code
            if (!userDoc.passwordResetCode || !userDoc.passwordResetExp || req.body.code !== userDoc.passwordResetCode || userDoc.passwordResetExp < new Date()) {
                return errorMessage(403, 'Your reset code is invalid or has expired.');
            }

            // reset password
            userDoc.password = req.body.password;
            userDoc.save(function(err) {
                if (err) {error.log(new Error(err)); return errorMessage();}

                // login user
                req.login(userDoc, function(err) {
                    if (err) {error.log(new Error(err)); return errorMessage(500, 'Your password has been reset, but we had trouble automatically logging you in. Please <a href="'+req.protocol+'://'+req.get('host')+'/login">login</a> with your new password.');}

                    // done
                    logger.result('password reset');
                    return res.sendStatus(200);
                });
            });
        });
};
