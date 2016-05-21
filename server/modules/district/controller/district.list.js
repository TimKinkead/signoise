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
 * DISTRICT.LIST
 * - List districts.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'List Districts Error!',
            message: message || 'We had trouble listing the districts. Please try again.'
        });
    }

    if (!req.user || !req.user._id) { return errorMessage(403, 'Please login or sign up if you want to list the districts.'); }

    // list districts
    var query = {};
    if (req.query.state) {query.state = req.query.state;}
    if (req.query.county) {query.county = req.query.county;}
    District.find(query)
        .sort({name: 1})
        .skip(Number(req.query.skip))
        .limit((req.query.limit) ? Number(req.query.limit) : 100)
        .populate('state', '_id name abbv')
        .populate('county', '_id name')
        .exec(function(err, districtDocs) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!districtDocs) { error.log(new Error('!districtDocs')); return errorMessage(); }
            
            // done
            logger.result('districts listed');
            return res.status(200).send(districtDocs);
        });
};