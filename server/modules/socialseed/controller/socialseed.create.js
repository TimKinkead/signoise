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
 * SOCIALSEED.CREATE
 * - Create a social seed for pulling social media.
 */
exports.create = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Create Social Seed Error!',
            message: message || 'We had trouble creating your social seed. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to create a social seed.');}
    if (!req.user.admin) {return errorMessage(403, 'Only admins can create social seeds.');}

    if (req.body.query) {req.body.query = req.body.query.toLowerCase();}

    // check platform parameters
    switch(req.body.platform) {
        //case 'facebook':
        //case 'instagram':
        case 'twitter':
            if (!req.body.query) {return errorMessage(400, 'Please provide a valid query if you want to create a Twitter social seed.');}
            break;
        default:
            return errorMessage(400, 'Please provide a valid platform if you want to create a social seed.');
    }

    // check if seed already exists
    SocialSeed.findOne({platform: req.body.platform, query: req.body.query})
        .exec(function(err, seedDoc) {
            if (err) {error.log(new Error(err)); return errorMessage();}

            if (seedDoc) {

                // update seed
                if (req.body.frequency) {seedDoc.frequency = req.body.frequency;}

            } else {

                // create seed
                seedDoc = new SocialSeed({
                    platform: req.body.platform,
                    query: req.body.query,
                    frequency: req.body.frequency
                });

            }

            // save new or updated seed doc
            seedDoc.save(function(err) {
                if (err) {error.log(new Error(err)); return errorMessage();}

                // done
                logger.result('social seed created');
                return res.status(200).send(seedDoc);
            });
        });
};