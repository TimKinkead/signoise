'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    District = mongoose.model('District'),
    SocialMedia = mongoose.model('SocialMedia');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error/index'),
    logger = require('../../logger/index');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Update a district's 'relatedTwitterSeeds' field.
 * @param host - req.get('host')
 * @param seedId - social seed _id
 * @param screen_names - array of screen names with 'user_mentions' count
 */
function updateDistrict(host, seedId, screen_names) {
    if (!seedId) { error.log(new Error('!seedId')); return; }
    if (!screen_names) { error.log(new Error('!screen_names')); return; }
    if (!screen_names.length) { return;}

    var relatedTwitterSeeds = [];

    // perform update
    function performUpdate() {
        District.update(
            {twitterSeed: seedId},
            {$set: {relatedTwitterSeeds: relatedTwitterSeeds}},
            function(err) {
                if (err) { error.log(new Error(err)); }
            }
        );
    }

    // check done
    var cnt = screen_names.length;
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            performUpdate();
        }
    }

    // get seed ids for screen names
    screen_names.forEach(function(snObj) {
        if (!snObj.screen_name) { checkDone(); return; }
        
        request.post(
            {
                url: url.parse('http://'+host+'/data/socialseed'),
                json: true,
                body: {platform: 'twitter', twitter: {query: snObj.screen_name}, frequency: 'daily'}
            },
            function(err, response, body) {
                // error logged by socialseed.create
                if (body && body._id && body._id.toString() !== seedId.toString()) { 
                    relatedTwitterSeeds.push(body._id); 
                }
                checkDone();
            }
        );
    });
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.UPDATE.DISTRICT.RELATED
 * - Update related social media for all districts.
 * - Run this once in a while.
 */
exports.updateDistrictRelated = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Update District Related Social Media Error!',
            message: message || 'We had trouble updating the district related social media. Please try again.'
        });
    }

    // get all districts
    District.find({})
        .exec(function(err, districtDocs) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!districtDocs) { error.log(new Error('!districtDocs')); return errorMessage(); }

            // grab twitter seed ids
            var twSeedIds = [];
            districtDocs.forEach(function(doc) {
                if (doc.twitterSeed) { twSeedIds.push(doc.twitterSeed); }
            });
            
            // aggregate district social media to determine related accounts from user_mentions
            SocialMedia.aggregate(
                [
                    {$match: {socialseed: {$in: twSeedIds}}},
                    {$unwind: {path: '$data.entities.user_mentions'}},
                    {$group: {_id: {socialseed: '$socialseed', screen_name: '$data.entities.user_mentions.screen_name'}, user_mentions: {$sum: 1}}},
                    {$match: {user_mentions: {$gte: 50}}},
                    {$sort: {user_mentions: -1}},
                    {$group: {_id: '$_id.socialseed', screen_names: {$push: {screen_name: '$_id.screen_name', user_mentions: '$user_mentions'}}}} // user mentions doesn't seem to be working here (mongochef) but seems fine in mongo shell
                ],
                function(err, resultDocs) {
                    if (err) { error.log(new Error(err)); return errorMessage(); }
                    if (!resultDocs) { error.log(new Error('!resultDocs')); return errorMessage(); }
                    
                    // update Districts
                    resultDocs.forEach(function(resultDoc) {
                        updateDistrict(req.get('host'), resultDoc._id, resultDoc.screen_names);
                    });

                    // done
                    return res.status(200).send('Working on updating district related social media.');
                }
            );
    });
};