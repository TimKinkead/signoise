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
 * Generate a random password reset code.
 * @returns {string} - combination of letters and numbers
 */
function resetCode() {
    var numbers = ['1', '2', '3', '4', '5'],
        letters = ['A', 'B', 'C', 'D', 'E'],
        code = '';
    for (var i=0; i<10; i++) {
        var num = (Math.random() < 0.5);
        if (num) {code += numbers[Math.floor(Math.random()*numbers.length)];}
        else {code += letters[Math.floor(Math.random()*letters.length)];}
    }
    return code;
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * USER.PASSWORD.FORGOT
 * - Save reset password token for user.
 */
exports.forgotPassword = function(req, res, next) {
	logger.filename(__filename);

    // error message
    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Reset Password Error!',
            message: message || 'We had trouble sending you a reset code. Please try again.'
        });
    }

    if (!req.body.email) {return errorMessage(400, 'Please provide your email address so we can send you a password reset code.');}

    // variables
    var exp = new Date();
    exp.setDate(exp.getDate()+1);

    // get user (and make sure user exists)
    User.findOne({email: req.body.email.toLowerCase()})
        .select('name firstName email')
        .exec(function(err, userDoc) {
            if (err) {error.log(new Error(err)); return errorMessage();}
            if (!userDoc) {return errorMessage(404, '<p>Sorry, we couldn\'t find an account with that email. Want to <a href="'+req.protocol+'://'+req.get('host')+'/sign-up">sign up</a>?</p>');}

            // save reset code
            userDoc.passwordResetCode = resetCode();
            userDoc.passwordResetExp = (function() {var d = new Date(); d.setDate(d.getDate()+1); return d;})();
            userDoc.save(function(err) {
                if (err) {error.log(new Error(err)); return errorMessage();}

                // send email
                // TODO - finish
                return res.sendStatus(200);
            });
        });
};
