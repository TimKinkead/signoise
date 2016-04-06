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
    var cnt;
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

    cnt = 6;
    countSocialMedia({}, 'all');                                    // 1
    countSocialMedia({ngrams: {$exists: true}}, 'ngrams');          // 2
    countSocialMedia({sentiment: {$exists: true}}, 'sentiment');    // 3
    countSocialMedia({platform: 'facebook'}, 'facebook');           // 4
    countSocialMedia({platform: 'instagram'}, 'instagram');         // 5
    countSocialMedia({platform: 'twitter'}, 'twitter');             // 6
};