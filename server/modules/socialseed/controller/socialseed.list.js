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
    switch (req.query.filterBy) {
        case 'active':
            query = {frequency: {$in: ['hourly', 'daily', 'weekly']}};
            sort = {media: -1};
            break;
        case 'inactive':
            query = {frequency: {$exists: false}};
            sort = {references: -1};
            break;
        //case 'all':
        default:
            query = {};
            sort = {media: -1, references: -1};
    }
    if (req.query.platform) {query.platform = req.query.platform;}
    
    // list social seeds
    SocialSeed.find(query)
        .select('-history')
        .sort(sort)
        .skip(Number(req.query.skip))
        .limit((req.query.limit) ? Number(req.query.limit) : 100)
        .exec(function(err, seedDocs) {
            if (err) {error.log(new Error(err)); return errorMessage();}
            
            // done
            logger.result('social seeds listed');
            return res.status(200).send(seedDocs);
        });
};