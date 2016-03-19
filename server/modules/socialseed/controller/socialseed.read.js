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
 * SOCIALSEED.READ
 * - Read a social seed.
 */
exports.read = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Read Social Seed Error!',
            message: message || 'We had trouble getting that social seed. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to get a social seed.');}
    if (!req.query._id) {return errorMessage(400, 'Please provide a social seed id.');}

    // get social seed
    SocialSeed.findById(req.query._id)
        .exec(function(err, seedDoc) {
            if (err) {error.log(new Error(err)); return errorMessage();}
            if (!seedDoc) {error.log(new Error('!seedDoc')); return errorMessage();}

            // done
            logger.result('found social seed');
            return res.status(200).send(seedDoc);
        });
};