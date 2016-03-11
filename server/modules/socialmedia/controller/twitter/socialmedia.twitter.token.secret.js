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
 * Get a twitter token and secret from current user or any user.
 * @param user - a user doc (optional)
 * @param clbk - return clbk(err, token, secret)
 */
exports.getTwitterTokenAndSecret = function(user, clbk) {
    logger.filename(__filename);

    // handle optional user argument
    if (!clbk) { clbk = user; user = null; }

    // check current user
    if (user && user.twitterToken && user.twitterSecret) {
        return clbk(null, user.twitterToken, user.twitterSecret);
    }

    // get all users with twitter token and secret
    User.find({twitterToken: {$exists: true}, twitterSecret: {$exists: true}})
        .select('twitterToken twitterSecret')
        .exec(function (err, userDocs) {
            if (err) {return clbk(new Error(err));}
            if (!userDocs) {return clbk(new Error('!userDocs'));}
            if (!userDocs.length) {return clbk(new Error('!userDocs.length'));}

            // pick a user and grab their token and secret
            var random = Math.floor(Math.random() * userDocs.length);
            user = userDocs[random];

            // done
            return clbk(null, user.twitterToken, user.twitterSecret);
        });
};