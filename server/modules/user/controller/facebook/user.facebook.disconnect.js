'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    User = mongoose.model('User');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../../error'),
    logger = require('../../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * USER.FACEBOOK.DISCONNECT
 * - Disconnect facebook account.
 */
exports.facebookDisconnect = function(req, res, next) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Facebook Disconnect Error!',
            message: message || 'We had trouble disconnecting your Facebook account. Please try again.'
        });
    }

    if (!req.user) {return errorMessage(403, 'Please login if you want to disconnect your Facebook account.');}

    // delete facebook access token
    req.user.facebookAccessToken = null;
    req.user.save(function(err) {
        if (err) {error.log(new Error(err)); return errorMessage();}

        // done
        logger.result('facebook disconnected');
        return res.sendStatus(200);
    });
};
