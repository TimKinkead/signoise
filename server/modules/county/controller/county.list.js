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
 * COUNTY.LIST
 * - List counties.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'List Countys Error!',
            message: message || 'We had trouble listing the countys. Please try again.'
        });
    }

    if (!req.user || !req.user._id) { return errorMessage(403, 'Please login or sign up if you want to list the counties.'); }
    if (!req.query.state) { return errorMessage(400, 'Please provide a state if you want to list the counties.'); }
    
    // aggregate districts by county
    District.aggregate(
        [
            {$match: {state: req.query.state}},
            {$group: {_id: '$county', districtCount: {$sum: 1}}},
            {$sort: {_id: 1}}
        ],
        function(err, countyDocs) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!countyDocs) { error.log(new Error('!countyDocs')); return errorMessage(); }

            // done
            logger.result('counties listed');
            return res.status(200).send(countyDocs);
        }
    );
};