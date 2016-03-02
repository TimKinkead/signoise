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
 * SOCIALSEED.LIST
 * - List social seeds.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'List Social Seeds Error!',
            message: message || 'We had trouble listing the social seeds. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to list the social seeds.');}

    // mongodb query parameters
    var query, sort;
    if (req.query.active) {
        query = {frequency: {$in: ['hourly', 'daily', 'weekly']}};
        sort = {media: -1};
    } else if (req.query.pending) {
        query = {frequency: {$exists: false}};
        sort = {references: -1};
    } else {
        query = {};
        sort = {media: -1, references: -1};
    }
    
    // list social seeds
    SocialSeed.find(query)
        .select('-history')
        .sort(sort)
        .skip(req.query.skip)
        .limit(req.query.limit)
        .exec(function(err, seedDocs) {
            if (err) {error.log(new Error(err)); return errorMessage();}
            
            // done
            logger.result('social seeds listed');
            return res.status(200).send(seedDocs);
        });
};