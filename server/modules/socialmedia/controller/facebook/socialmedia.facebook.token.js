'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    User = mongoose.model('User');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logger = require('../../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Get a facebook access token from current user or any user.
 * @param user - a user doc (optional)
 * @param clbk - return clbk(err, token, secret)
 */
exports.getFacebookToken = function(user, clbk) {
    logger.filename(__filename);

    // handle optional user argument
    if (!clbk) { clbk = user; user = null; }

    // check current user
    if (user && user.facebookAccessToken) {
        return clbk(null, user.facebookAccessToken);
    }

    // get all users with facebook access token
    User.find({facebookAccessToken: {$exists: true}})
        .select('facebookAccessToken')
        .exec(function (err, userDocs) {
            if (err) {return clbk(new Error(err));}
            if (!userDocs) {return clbk(new Error('!userDocs'));}
            if (!userDocs.length) {return clbk(new Error('!userDocs.length'));}

            // pick a user and grab their token and secret
            var random = Math.floor(Math.random() * userDocs.length);
            user = userDocs[random];

            // done
            return clbk(null, user.facebookAccessToken);
        });
};