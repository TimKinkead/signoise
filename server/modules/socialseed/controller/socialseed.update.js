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
 * SOCIALSEED.UPDATE
 * - Update a social seed.
 */
exports.update = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Update Social Seed Error!',
            message: message || 'We had trouble updating the social seed. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to update a social seed.');}
    if (!req.user.admin) {return errorMessage(403, 'Only admins can update social seeds.');}
    if (!req.body._id) {return errorMessage(400, 'Please provide a social seed ID if you want to update a social seed.');}

    // get seed
    SocialSeed.findById(req.body._id)
        .exec(function(err, seedDoc) {
            if (err || !seedDoc) {error.log(new Error(err || '!seedDoc')); return errorMessage();}

            // update seed
            if (req.body.frequency) {seedDoc.frequency = req.body.frequency;}
            seedDoc.save(function(err) {
                if (err) {error.log(new Error(err)); return errorMessage();}

                // done
                logger.result('social seed updated');
                return res.sendStatus(200);
            });
        });
};