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
 * SOCIALSEED.DELETE
 * - Delete a social seed.
 */
exports.delete = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Delete Social Seed Error!',
            message: message || 'We had trouble deleting the social seed. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to delete a social seed.');}
    if (!req.user.admin) {return errorMessage(403, 'Only admins can delete social seeds.');}
    if (!req.body._id) {return errorMessage(400, 'Please provide a social seed ID if you want to delete a social seed.');}

    // delete seed
    SocialSeed.remove({_id: req.body._id}, function(err) {
        if (err) {error.log(new Error(err)); return errorMessage();}

        // done
        logger.result('social seed deleted');
        return res.sendStatus(200);
    });
};