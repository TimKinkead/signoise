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
 * DISTRICT.DELETE
 * - Delete a district.
 */
exports.delete = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Delete District Error!',
            message: message || 'We had trouble deleting the district. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to delete a district.');}
    if (!req.user.admin) {return errorMessage(403, 'Only admins can delete districts.');}
    if (!req.body._id) {return errorMessage(400, 'Please provide a district ID if you want to delete a district.');}

    // delete district
    District.remove({_id: req.body._id}, function(err) {
        if (err) {error.log(new Error(err)); return errorMessage();}

        // done
        logger.result('district deleted');
        return res.sendStatus(200);
    });
};