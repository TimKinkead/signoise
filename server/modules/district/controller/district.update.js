'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash');

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
 * DISTRICT.UPDATE
 * - Update a district.
 */
exports.update = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Update District Error!',
            message: message || 'We had trouble updating the district. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to update a district.');}
    if (!req.user.admin) {return errorMessage(403, 'Only admins can update districts.');}
    if (!req.body._id) {return errorMessage(400, 'Please provide a district ID if you want to update a district.');}

    // get district
    District.findById(req.body._id)
        .exec(function(err, districtDoc) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!districtDoc) { error.log(new Error('!districtDoc')); return errorMessage(); }
            
            // update district
            delete req.body._id;
            districtDoc = _.extend(districtDoc, req.body);
            districtDoc.save(function(err) {
                if (err) {error.log(new Error(err)); return errorMessage();}

                // done
                logger.result('district updated');
                return res.sendStatus(200);
            });
        });
};