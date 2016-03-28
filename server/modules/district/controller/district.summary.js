'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    District = mongoose.model('District');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * DISTRICT.SUMMARY
 * - Get summary info for districts.
 */
exports.summary = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'District Summary Error!',
            message: message || 'We had trouble generating the district summary. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to get the district summary.');}

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

    function countDistricts(query, field) {
        District.count(query, function(err, qty) {
            if (err) {error.log(new Error(err));}
            if (qty || qty === 0) { summary[field] = qty; }
            checkDone();
        });
    }

    cnt = 1;
    countDistricts({}, 'all');
};