'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    District = mongoose.model('District'),
    Topic = mongoose.model('Topic');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Get social seed ids for a specific state/county.
 * @param query - req.query
 * @param clbk - return clbk(err, results)
 */
function getSeedIds(query, clbk) {
    if (!query) { return clbk(new Error('!query')); }

    var seedIds = [],
        mongoQuery = {};
    if (query.state) { mongoQuery.state = query.state; }
    if (query.county) { mongoQuery.county = query.county; }

    // get districts in state/county
    District.find(
        mongoQuery,
        function(err, districtDocs) {
            if (err) { return clbk(new Error(err)); }
            if (!districtDocs) { return clbk(new Error('!districtDocs')); }

            // grab seed ids
            districtDocs.forEach(function(cV) {
                if (cV.facebookSeed) { seedIds.push(cV.facebookSeed); }
                if (cV.twitterSeed) { seedIds.push(cV.twitterSeed); }
            });

            // done
            return clbk(null, seedIds);
        }
    );
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * ANALYSIS.UTIL.SOCIALMEDIA
 * - Perform social media analysis and return results. (sentiment or ngrams)
 * @param analysisType - 'sentiment' or 'ngrams'
 * @param query - req.query
 * @param clbk - return clbk(err, results)
 */
exports.analyzeSocialMedia = function(analysisType, query, clbk) {
    logger.filename(__filename);

    if (!analysisType) { return clbk(new Error('!analysisType')); }
    if (!query) { return clbk(new Error('!query')); }
    if (!query.topic) { return clbk(new Error('!query.topic')); }
    if (!query.minDate) { return clbk(new Error('!query.minDate')); }
    if (!query.maxDate) { return clbk(new Error('!query.maxDate')); }

    // get full topic
    Topic.findById(query.topic, function(err, topicDoc) {
        if (err) { return clbk(new Error(err)); }
        if (!topicDoc) { return clbk(new Error('!topicDoc')); }
        if (!topicDoc.keywords) { return clbk(new Error('!topicDoc.keywords')); }
        if (!topicDoc.keywords.length) { return clbk(new Error('!topicDoc.keywords.length')); }
        if (!topicDoc.simpleKeywords) { return clbk(new Error('!topicDoc.simpleKeywords')); }
        if (!topicDoc.simpleKeywords.length) { return clbk(new Error('!topicDoc.simpleKeywords.length')); }

        // aggregation pipeline setup
        var pipeline = [
            {
                $match: {
                    $text: {$search: topicDoc.simpleKeywords},
                    date: {$gte: query.minDate, $lt: query.maxDate}
                }
            },
            {
                $match: {
                    ngramsProcessed: {$exists: true},
                    $or: [
                        {'ngrams.1.sorted.word': {$in: topicDoc.ngrams['1']}},
                        {'ngrams.2.sorted.word': {$in: topicDoc.ngrams['2']}},
                        {'ngrams.3.sorted.word': {$in: topicDoc.ngrams['3']}},
                        {'ngrams.4.sorted.word': {$in: topicDoc.ngrams['4']}}
                    ]
                }
            }
        ];

        // perform analysis
        function performAnalysis() {
            logger.log(JSON.stringify(pipeline));
            SocialMedia.aggregate(
                pipeline,
                function(err, resultDocs) {
                    if (err) { return clbk(new Error(err)); }
                    if (!resultDocs) { return clbk(new Error('!resultDocs')); }
                    if (resultDocs.length !== 1) { return clbk(new Error('resultDocs.length !== 1')); }

                    // clean up results
                    var results = resultDocs[0];
                    if (analysisType === 'ngrams' && results.ngrams && results.ngrams.constructor === Array) {
                        var newNgrams = {};
                        results.ngrams.forEach(function(cV) {
                            if (cV.gramSize) {
                                newNgrams[cV.gramSize.toString()] = cV.ngrams;
                            }
                        });
                        results.ngrams = newNgrams;
                    }
                    
                    // done
                    return clbk(null, results);
                }
            );
        }

        // check analysis type
        function checkAnalysisType() {
            switch (analysisType) {
                case 'sentiment':
                    pipeline = pipeline.concat([
                        {$group: {
                            _id: null,
                            count: {$sum: 1},
                            sentimentAvg: {$avg: '$sentiment'},
                            sentimentCount: {$sum: {$cond: {if: {$gte: ['$sentiment', -1]}, then: 1, else: 0}}},
                            sentimentPostitive: {$sum: {$cond: {if: {$gte: ['$sentiment', 0.2]}, then: 1, else: 0}}},
                            sentimentNegative: {$sum: {$cond: {if: {$lte: ['$sentiment', -0.2]}, then: 1, else: 0}}}
                        }},
                        {$project: {
                            count: true, 
                            sentiment: {
                                avg: '$sentimentAvg',
                                count: '$sentimentCount',
                                positive: '$sentimentPositive',
                                negative: '$sentimentNegative'
                            }
                        }}
                    ]);
                    break;
                case 'ngrams':
                    pipeline = pipeline.concat([
                        // unwind ngrams.1
                        {$project: {
                            count: {$cond: {if: {$gt: [{$size: '$ngrams.1.sorted'}, 0]}, then: {$divide: [1, {$size: '$ngrams.1.sorted'}]}, else: 1}},
                            sentiment: true,
                            ngrams: true
                        }},
                        {$unwind: {path: '$ngrams.1.sorted', includeArrayIndex: 'index'}},
                        {$project: {
                            ngram: ['$ngrams.1'],
                            ngrams: {$cond: {if: {$eq: ['$index', 0]}, then: '$ngrams', else: null}}}},
                        // unwind ngrams.2
                        {$unwind: {path: '$ngrams.2.sorted', includeArrayIndex: 'index'}},
                        {$project: {
                            ngram: {$cond: {if: {$eq: ['$index', 0]}, then: {$concatArrays: ['$ngram', ['$ngrams.2']]}, else: ['$ngrams.2']}},
                            ngrams: {$cond: {if: {$eq: ['$index', 0]}, then: '$ngrams', else: {}}}
                        }},
                        // unwind ngrams.3
                        {$unwind: {path: '$ngrams.3.sorted', includeArrayIndex: 'index'}},
                        {$project: {
                            ngram: {$cond: {if: {$eq: ['$index', 0]}, then: {$concatArrays: ['$ngram', ['$ngrams.3']]}, else: ['$ngrams.3']}},
                            ngrams: {$cond: {if: {$eq: ['$index', 0]}, then: '$ngrams', else: {}}}
                        }},
                        // unwind ngrams.4
                        {$unwind: {path: '$ngrams.4.sorted', includeArrayIndex: 'index'}},
                        {$project: {
                            ngram: {$cond: {if: {$eq: ['$index', 0]}, then: {$concatArrays: ['$ngram', ['$ngrams.4']]}, else: ['$ngrams.4']}},
                        }},
                        // unwind normalized ngram field
                        {$unwind: {path: '$ngram'}},
                        // group by ngram word
                        {$group: {
                            _id: {gramSize: '$ngram.gramSize', word: '$ngram.sorted.word'}, 
                            count: {$sum: '$ngram.sorted.count'},
                            gramCount: {$sum: '$ngram.gramCount'},
                            wordCount: {$sum: '$ngram.wordCount'}
                        }},
                        // sort by frequency
                        {$project: {_id: true, count: true, gramCount: true, wordCount: true, frequency: {$divide: ['$count', '$gramCount']}}},
                        {$sort: {frequency: -1}},
                        // group by gram count
                        {$group: {
                            _id: '$_id.gramSize',
                            ngrams: {$push: {word: '$_id.word', count: '$count', gramCount: '$gramCount', wordCount: '$wordCount', frequency: '$frequency'}}
                        }},
                        // only keep top 20 ngrams
                        {$project: {ngrams: {$slice: ['$ngrams', 20]}}},
                        // group all
                        {$group: {_id: null, ngrams: {$push: {gramSize: '$_id', ngrams: '$ngrams'}}}}
                    ]);
                    break;
                default:
                    return clbk(new Error('analysis type "'+query.channel+'" is not supported'));
            }
            performAnalysis();
        }
        
        // check channel
        function checkChannel() {
            switch (query.channel) {
                case 'all social media':
                    checkAnalysisType();
                    break;
                case 'district social media':
                    getSeedIds(query, function(err, seedIds) {
                        if (err) { return clbk(err); }
                        if (!seedIds) { return clbk(new Error('!seedIds')); }
                        if (!seedIds.length) { return clbk(new Error('!seedIds.length')); }
                        pipeline[0].$match.socialseed = {$in: seedIds};
                        checkAnalysisType();
                    });
                    break;
                default:
                    return clbk(new Error('channel "'+query.channel+'" is not supported'));
            }
        }

        // start
        checkChannel();
    });
};