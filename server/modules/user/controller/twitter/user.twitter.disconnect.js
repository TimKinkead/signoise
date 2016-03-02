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
 * USER.TWITTER.DISCONNECT
 * - Disconnect twitter account.
 */
exports.twitterDisconnect = function(req, res, next) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Twitter Disconnect Error!',
            message: message || 'We had trouble disconnecting your Twitter account. Please try again.'
        });
    }

    if (!req.user) {return errorMessage(403, 'Please login if you want to disconnect your Twitter account.');}

    // delete twitter token and secret
    req.user.twitterToken = null;
    req.user.twitterSecret = null;
    req.user.save(function(err) {
        if (err) {error.log(new Error(err)); return errorMessage();}

        // done
        logger.result('twitter disconnected');
        return res.sendStatus(200);
    });
};
