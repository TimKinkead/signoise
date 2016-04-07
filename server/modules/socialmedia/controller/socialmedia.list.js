'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * SOCIALMEDIA.LIST
 * - List social media.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'List Social Media Error!',
            message: message || 'We had trouble listing social media. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to list social media.');}

    // mongodb query parameters
    var query, sort = {date: -1};
    switch (req.query.filterBy) {
        case 'ngrams':
            query = {ngramsProcessed: {$exists: true}};
            break;
        case 'sentiment':
            query = {sentimentProcessed: {$exists: true}};
            break;
        case 'facebook':
            query = {platform: 'facebook'};
            break;
        case 'instagram':
            query = {platform: 'instagram'};
            break;
        case 'twitter':
            query = {platform: 'twitter'};
            break;
        //case 'all':
        default:
            query = {};
    }

    // list social media
    SocialMedia.find(query)
        .sort(sort)
        .skip(Number(req.query.skip))
        .limit((req.query.limit) ? Number(req.query.limit) : 100)
        .populate('socialseed', 'title')
        .exec(function(err, mediaDocs) {
            if (err) {error.log(new Error(err)); return errorMessage();}

            // done
            logger.result('social media listed');
            return res.status(200).send(mediaDocs);
        });
};