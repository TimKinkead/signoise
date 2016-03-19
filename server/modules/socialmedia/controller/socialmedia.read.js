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
 * SOCIALMEDIA.READ
 * - Read a social media doc.
 */
exports.read = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Read Social Media Error!',
            message: message || 'We had trouble getting that social media document. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to get a social media document.');}
    if (!req.query._id) {return errorMessage(400, 'Please provide a social media document id.');}

    // get social media
    SocialMedia.findById(req.query._id)
        .populate('socialseed', 'title')
        .exec(function(err, mediaDoc) {
            if (err) {error.log(new Error(err)); return errorMessage();}
            if (!mediaDoc) {error.log(new Error('!mediaDoc')); return errorMessage();}

            // done
            logger.result('found social media');
            return res.status(200).send(mediaDoc);
        });
};