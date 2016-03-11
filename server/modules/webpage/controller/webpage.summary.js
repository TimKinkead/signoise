'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    WebPage = mongoose.model('WebPage');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * PAGE.SUMMARY
 * - Get summary info for web pages.
 */
exports.summary = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'WebPages Summary Error!',
            message: message || 'We had trouble generating the webpages summary. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to get the webpages summary.');}

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

    function countPages(query, field) {
        WebPage.count(query, function(err, qty) {
            if (err) {error.log(new Error(err));}
            summary[field] = qty;
            checkDone();
        });
    }

    cnt = 6;
    countPages({}, 'all');                              // 1
    countPages({status: 'pending'}, 'pending');         // 2
    countPages({status: 'fetched'}, 'fetched');         // 3
    countPages({status: 'ignored'}, 'ignored');         // 4
    countPages({status: 'redirected'}, 'redirected');   // 5
    countPages({status: 'scheduled'}, 'scheduled');     // 6
};