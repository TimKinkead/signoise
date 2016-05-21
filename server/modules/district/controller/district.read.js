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
 * DISTRICT.READ
 * - Read a district.
 */
exports.read = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Read District Error!',
            message: message || 'We had trouble getting that district. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to get a district.');}
    if (!req.query._id) {return errorMessage(400, 'Please provide a district id.');}

    // get district
    District.findById(req.query._id)
        .populate('state', '_id name abbv')
        .populate('county', '_id name')
        .populate('website', 'domain subdomain url fetched ignored redirected scheduled externalReferences socialReferences')
        .populate('facebookSeed', 'title twitter facebook references media')
        .populate('twitterSeed', 'title twitter facebook references media')
        .exec(function(err, districtDoc) {
            if (err) {error.log(new Error(err)); return errorMessage();}
            if (!districtDoc) {error.log(new Error('!districtDoc')); return errorMessage();}

            // done
            logger.result('found district');
            return res.status(200).send(districtDoc);
        });
};