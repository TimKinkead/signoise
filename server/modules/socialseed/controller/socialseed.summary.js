'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialSeed = mongoose.model('SocialSeed');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * SOCIALSEED.SUMMARY
 * - Get summary info for social seeds.
 */
exports.summary = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Social Seed Summary Error!',
            message: message || 'We had trouble generating the social seed summary. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to get the social seed summary.');}

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

    function countSocialSeeds(query, field, clbk) {
        SocialSeed.count(query, function(err, qty) {
            if (err) {error.log(new Error(err));}
            summary[field] = qty;
            checkDone();
        });
    }

    // (1) count all seed docs
    countSocialSeeds({}, 'total');

    // (2) count all facebook seed docs
    countSocialSeeds({platform: 'facebook'}, 'facebook');

    // (3) count all instagram seed docs
    countSocialSeeds({platform: 'instagram'}, 'instagram');

    // (4) count all twitter seed docs
    countSocialSeeds({platform: 'twitter'}, 'twitter');
};