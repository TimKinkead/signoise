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

    // commented out for bulk insert
    //if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to create a social seed.');}
    //if (!req.user.admin) {return errorMessage(403, 'Only admins can create social seeds.');}
    
    // check platform parameters & construct query
    // - user requirements commented out for bulk insert 
    var query = {platform: req.body.platform};
    switch(req.body.platform) {
        case 'facebook':
            //if (!req.user.facebook) {return errorMessage(403, 'Please go to settings and connect your Facebook account if you want to create a social seed.');}
            if (!req.body.facebook) {error.log(new Error('!req.body.facebook')); return errorMessage();}
            if (!req.body.facebook.id) {error.log(new Error('!req.body.facebook.id')); return errorMessage();}
            query['facebook.id'] = req.body.facebook.id;
            break;
        //case 'instagram':
        case 'twitter':
            //if (!req.user.twitter) {return errorMessage(403, 'Please go to settings and connect your Twitter account if you want to create a social seed.');}
            if (!req.body.twitter) {error.log(new Error('!req.body.twitter')); return errorMessage();}
            if (!req.body.twitter.query && (!req.body.twitter.latitude || !req.body.twitter.longitude || !req.body.twitter.radius)) {
                error.log(new Error('!req.body.twitter.query && !req.body.twitter.geocode')); return errorMessage();
            }
            if (req.body.twitter.query) {
                req.body.twitter.query = req.body.twitter.query.toLowerCase();
                query['twitter.query'] = req.body.twitter.query;
            }
            if (req.body.twitter.latitude && req.body.twitter.longitude && req.body.twitter.radius) {
                query['twitter.latitude'] = req.body.twitter.latitude;
                query['twitter.longitude'] = req.body.twitter.longitude;
                query['twitter.radius'] = req.body.twitter.radius;
            }
            break;
        default:
            return errorMessage(400, 'Please provide a valid platform if you want to create a social seed.');
    }
    if (!req.body.frequency) {return errorMessage(400, 'Please select a pull frequency if you want to create a social seed.');}

    // check if seed already exists
    SocialSeed.findOne(query)
        .exec(function(err, seedDoc) {
            if (err) {error.log(new Error(err)); return errorMessage();}

            // update seed if it exists
            if (seedDoc) { 
                seedDoc.frequency = req.body.frequency; 
                if (req.body.relatedTwitterSeeds) { seedDoc.relatedTwitterSeeds = req.body.relatedTwitterSeeds; }
            }

            // otherwise create new seed
            else {
                seedDoc = new SocialSeed({
                    platform: req.body.platform,
                    frequency: req.body.frequency
                });
                if (req.body.facebook) { seedDoc.facebook = req.body.facebook; }
                if (req.body.twitter) { seedDoc.twitter = req.body.twitter; }
                if (req.body.relatedTwitterSeeds) { seedDoc.relatedTwitterSeeds = req.body.relatedTwitterSeeds; }
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