'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    Topic = mongoose.model('Topic'),
    State = mongoose.model('State'),
    County = mongoose.model('County'),
    District = mongoose.model('District');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Variables

var sentimentConfig = require('../../analysis').sentimentConfig;

//----------------------------------------------------------------------------------------------------------------------
// Main

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

    // parameters
    var query = {}, sort = {date: -1};

    function getMedia() {
        //logger.bold(JSON.stringify(query, null, 4));
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
    }

    // topic
    function checkTopic() {
        if (!req.query.topic) { getMedia(); return; }
        Topic.findById(req.query.topic, function(err, topicDoc) {
            if (err) { error.log(new Error(err)); errorMessage(); return; }
            if (!topicDoc) { error.log(new Error('!topicDoc')); errorMessage(); return; }
            if (!topicDoc.keywords) { error.log(new Error('!topicDoc.keywords')); errorMessage(); return; }
            if (!topicDoc.keywords.length) { error.log(new Error('!topicDoc.keywords.length')); errorMessage(); return; }
            if (!topicDoc.simpleKeywords) { error.log(new Error('!topicDoc.simpleKeywords')); errorMessage(); return; }
            if (!topicDoc.simpleKeywords.length) { error.log(new Error('!topicDoc.simpleKeywords.length')); errorMessage(); return; }
            query.$text = {$search: topicDoc.simpleKeywords};
            query.$or = [
                {'ngrams.1.sorted.word': {$in: topicDoc.ngrams['1']}},
                {'ngrams.2.sorted.word': {$in: topicDoc.ngrams['2']}},
                {'ngrams.3.sorted.word': {$in: topicDoc.ngrams['3']}},
                {'ngrams.4.sorted.word': {$in: topicDoc.ngrams['4']}}
            ];
            getMedia();
        });
    }

    // channel
    function checkChannel() {
        switch (req.query.channel) {
            case 'all social media':
                if (req.query.county) {
                    County.findById(req.query.county)
                        .select('geometry')
                        .exec(function(err, countyDoc) {
                            if (err) { error.log(new Error(err)); errorMessage(); return; }
                            if (!countyDoc) { error.log(new Error('!countyDoc')); errorMessage(); return; }
                            if (!countyDoc.geometry) { error.log(new Error('!countyDoc.geometry')); errorMessage(); return; }
                            query.location = {$geoWithin: {$geometry: countyDoc.geometry}};
                            checkTopic();
                        });
                } else if (req.query.state) {
                    State.findById(req.query.state)
                        .select('geometry')
                        .exec(function(err, stateDoc) {
                            if (err) { error.log(new Error(err)); errorMessage(); return; }
                            if (!stateDoc) { error.log(new Error('!stateDoc')); errorMessage(); return; }
                            if (!stateDoc.geometry) { error.log(new Error('!stateDoc.geometry')); errorMessage(); return; }
                            query.location = {$geoWithin: {$geometry: stateDoc.geometry}};
                            checkTopic();
                        });
                } else {
                    checkTopic();
                }
                break;
            case 'district social media':
            case 'district related social media':
                var seedIds = [],
                    dQuery = {};
                if (req.query.state) { dQuery.state = req.query.state; }
                if (req.query.county) { dQuery.county = req.query.county; }
                District.find(
                    dQuery,
                    function(err, districtDocs) {
                        if (err) { error.log(new Error(err)); errorMessage(); return; }
                        if (!districtDocs) { error.log(new Error('!districtDocs')); errorMessage(); return; }
                        districtDocs.forEach(function(cV) {
                            if (req.query.channel === 'district social media') {
                                if (cV.facebookSeed) { seedIds.push(cV.facebookSeed); }
                                if (cV.twitterSeed) { seedIds.push(cV.twitterSeed); }
                            } else if (req.query.channel === 'district related social media') {
                                if (cV.relatedTwitterSeeds) { seedIds = seedIds.concat(cV.relatedTwitterSeeds); }
                            }
                        });
                        if (!seedIds.length) { error.log(new Error('!seedIds.length')); errorMessage(); return; }
                        query.socialseed = {$in: seedIds};
                        checkTopic();
                    }
                );
                break;
            default:
                checkTopic();
        }
    }

    // -- START CHECKING PARAMS --

    // filterBy
    switch (req.query.filterBy) {
        case 'ngrams':
            query.ngramsProcessed = {$exists: true};
            break;
        case 'sentiment':
            query.sentimentProcessed = {$exists: true};
            break;
        case 'facebook':
            query.platform = 'facebook';
            break;
        case 'instagram':
            query.platform = 'instagram';
            break;
        case 'twitter':
            query.platform = 'twitter';
            break;
    }

    // sentiment class
    switch (req.query.sentimentClass) {
        case 'positive':
            query.sentiment = {$gte: sentimentConfig.positive};
            break;
        case 'negative':
            query.sentiment = {$lte: sentimentConfig.negative};
            break;
        case 'neutral':
            query.sentiment = {$gt: sentimentConfig.negative, $lt: sentimentConfig.positive};
            break;
    }

    // word
    if (req.query.word) {
        var wordCnt = req.query.word.split(' ').length;
        query['ngrams.'+wordCnt+'.sorted.word'] = req.query.word;
    }

    // min/max dates
    if (req.query.minDate || req.query.maxDate) {
        query.date = {};
        if (req.query.minDate) { query.date.$gt = req.query.minDate; }
        if (req.query.maxDate) { query.date.$lt = req.query.maxDate; }
    }

    // check other params
    checkChannel();
};