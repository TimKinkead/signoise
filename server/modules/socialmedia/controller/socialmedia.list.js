'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * SOCIALMEDIA.LIST
 * - List social media.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'List Social Media Error!',
            message: message || 'We had trouble listing social media. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to list social media.');}

    // list social medias
    var query = {};
    if (req.query.platform) {query.platform = req.query.platform;}
    SocialMedia.find(query)
        .sort({created: -1})
        .skip(req.query.skip)
        .limit(req.query.limit || 100)
        .exec(function(err, mediaDocs) {
            if (err) {error.log(new Error(err)); return errorMessage();}

            // done
            logger.result('social media listed');
            return res.status(200).send(mediaDocs);
        });
};