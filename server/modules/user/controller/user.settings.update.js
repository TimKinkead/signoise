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
 * Check if password is correct.
 * @param userId - a user's _id
 * @param password - the password to be checked
 * @param clbk - return clbk(err, wrongPassword)
 */
function checkPassword(userId, password, clbk) {
    if (!userId) {return clbk(new Error('!userId'));}
    if (!password) {return clbk();}

    // get user
    User.findById(userId)
        .select('password salt')
        .exec(function(err, userDoc) {
            if (err || !userDoc) {return clbk(new Error(err || '!userDoc'));}

            // done
            return clbk(null, !userDoc.authenticate(password));
        });
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * USER.SETTINGS.UPDATE
 * - Update a user's settings.
 */
exports.updateSettings = function(req, res, next) {
	logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Settings Error!',
            message: message || 'We had trouble updating your settings. Please try again.'
        });
    }

    if (!req.user) {return errorMessage(401, 'Please login if you want to update your settings');}

    // check password
    if (req.body.newPassword && !req.body.password) {return errorMessage(401, 'Please provide your current password if you want to set a new password.');}
    checkPassword(req.user._id, req.body.password, function(err, badPassword) {
        if (err) {error.log(new Error(err)); return errorMessage();}
        if (badPassword) {return errorMessage(401, 'Your current password is incorrect. Please try again.');}

        // update email
        if (req.body.email) {req.user.email = req.body.email;}

        // update password
        if (req.body.newPassword) {
            req.user.password = req.body.newPassword;
        } else {
            delete req.user.password;
            if (req.user._doc) {delete req.user._doc.password;}
        }

        // save updated settings
        req.user.save(function(err) {
            if (err) {error.log(new Error(err)); return errorMessage();}

            // done
            logger.result('user settings updated');
            return res.sendStatus(200);
        });
    });
};
