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
 * SOCIALMEDIA.SUMMARY
 * - Get summary info for social media.
 */
exports.summary = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Social Media Summary Error!',
            message: message || 'We had trouble generating the social media summary. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to get the social media summary.');}

    // summary metrics
    var summary = {};

    // check done
    var cnt = 4;
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            logger.result('got summary');
            return res.status(200).send(summary);
        }
    }

    function countSocialMedia(query, field, clbk) {
        SocialMedia.count(query, function(err, qty) {
            if (err) {error.log(new Error(err));}
            summary[field] = qty;
            checkDone();
        });
    }

    // (1) count all media docs
    countSocialMedia({}, 'total');

    // (2) count all facebook media docs
    countSocialMedia({platform: 'facebook'}, 'facebook');

    // (3) count all instagram media docs
    countSocialMedia({platform: 'instagram'}, 'instagram');

    // (4) count all twitter media docs
    countSocialMedia({platform: 'twitter'}, 'twitter');
};