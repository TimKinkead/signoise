'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var fs = require('fs');

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
 * @param query - req.query
 * @param clbk - return clbk(err, results)
 */
exports.analyzeSocialMedia = function(query, clbk) {
    logger.filename(__filename);
    
    if (!query) { return clbk(new Error('!query')); }
    if (!query.topic) { return clbk(new Error('!query.topic')); }
    if (!query.minDate) { return clbk(new Error('!query.minDate')); }
    if (!query.maxDate) { return clbk(new Error('!query.maxDate')); }

    var sentimentConfig = {
        veryPositive: 0.05,
        positive: 0.01,
        negative: -0.01,
        veryNegative: -0.05
    };
    
    function getSentimentClass(no) {
        if (no >= sentimentConfig.veryPositive) {return 'veryPositive';}
        if (no >= sentimentConfig.positive) {return 'positive';}
        if (no <= sentimentConfig.veryNegative) {return 'veryNegative';}
        if (no <= sentimentConfig.negative) {return 'negative';}
        return 'neutral';
    }

    // get full topic
    Topic.findById(query.topic, function(err, topicDoc) {
        if (err) { return clbk(new Error(err)); }
        if (!topicDoc) { return clbk(new Error('!topicDoc')); }
        if (!topicDoc.keywords) { return clbk(new Error('!topicDoc.keywords')); }
        if (!topicDoc.keywords.length) { return clbk(new Error('!topicDoc.keywords.length')); }
        if (!topicDoc.simpleKeywords) { return clbk(new Error('!topicDoc.simpleKeywords')); }
        if (!topicDoc.simpleKeywords.length) { return clbk(new Error('!topicDoc.simpleKeywords.length')); }

        function dataProjection(no) {
            var dataProj = {
                sentiment: '$sentiment',
                gramSize: '$ngrams.'+no+'.gramSize',
                gramCount: '$ngrams.'+no+'.gramCount',
                word: '$ngrams.'+no+'.sorted.word',
                wordCount: '$ngrams.'+no+'.sorted.count'
            };
            if (no === 1) { dataProj.original = {$cond: {if: {$eq: ['$index', 0]}, then: true, else: false}}; }
            return dataProj;
        }
        
        // aggregation pipeline setup
        var pipeline = [
            // match documents by text and date
            {$match: {
                $text: {$search: topicDoc.simpleKeywords},
                date: {$gte: query.minDate, $lt: query.maxDate}
            }},
            // match documents by sentiment/ngrams
            {$match: {
                sentimentProcessed: {$exists: true},
                ngramsProcessed: {$exists: true},
                $or: [
                    {'ngrams.1.sorted.word': {$in: topicDoc.ngrams['1']}},
                    {'ngrams.2.sorted.word': {$in: topicDoc.ngrams['2']}},
                    {'ngrams.3.sorted.word': {$in: topicDoc.ngrams['3']}},
                    {'ngrams.4.sorted.word': {$in: topicDoc.ngrams['4']}}
                ]
            }},
            // unwind ngrams.1
            {$unwind: {path: '$ngrams.1.sorted', includeArrayIndex: 'index', preserveNullAndEmptyArrays: true}},
            {$project: {
                data: [dataProjection(1)],
                sentiment: true,
                ngrams: {$cond: {if: {$eq: ['$index', 0]}, then: '$ngrams', else: null}}
            }},
            // unwind ngrams.2
            {$unwind: {path: '$ngrams.2.sorted', includeArrayIndex: 'index', preserveNullAndEmptyArrays: true}},
            {$project: {
                data: {$cond: {if: {$eq: ['$index', 0]}, then: {$concatArrays: ['$data', [dataProjection(2)]]}, else: [dataProjection(2)]}},
                sentiment: true,
                ngrams: {$cond: {if: {$eq: ['$index', 0]}, then: '$ngrams', else: null}}
            }},
            // unwind ngrams.3
            {$unwind: {path: '$ngrams.3.sorted', includeArrayIndex: 'index', preserveNullAndEmptyArrays: true}},
            {$project: {
                data: {$cond: {if: {$eq: ['$index', 0]}, then: {$concatArrays: ['$data', [dataProjection(3)]]}, else: [dataProjection(3)]}},
                sentiment: true,
                ngrams: {$cond: {if: {$eq: ['$index', 0]}, then: '$ngrams', else: null}}
            }},
            // unwind ngrams.4
            {$unwind: {path: '$ngrams.4.sorted', includeArrayIndex: 'index', preserveNullAndEmptyArrays: true}},
            {$project: {
                data: {$cond: {if: {$eq: ['$index', 0]}, then: {$concatArrays: ['$data', [dataProjection(4)]]}, else: [dataProjection(4)]}}
            }},
            // unwind data field
            {$unwind: {path: '$data'}},
            // group by ngram word
            {$group: {
                _id: {gramSize: '$data.gramSize', word: '$data.word'},
                sentiment: {$avg: '$data.sentiment'},
                gramCount: {$sum: '$data.gramCount'},
                wordCount: {$sum: '$data.wordCount'},
                totalCount: {$sum: {$cond: {if: {$eq: ['$data.original', true]}, then: 1, else: 0}}},
                totalSentiment: {$sum: {$cond: {if: {$eq: ['$data.original', true]}, then: '$data.sentiment', else: 0}}},
                veryPositiveSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$data.original', true]}, {$gte: ['$data.sentiment', sentimentConfig.veryPositive]}]}, then: 1, else: 0}}},
                positiveSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$data.original', true]}, {$gte: ['$data.sentiment', sentimentConfig.positive]}, {$lt: ['$data.sentiment', sentimentConfig.veryPositive]}]}, then: 1, else: 0}}},
                neutralSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$data.original', true]}, {$gt: ['$data.sentiment', sentimentConfig.negative]}, {$lt: ['$data.sentiment', sentimentConfig.positive]}]}, then: 1, else: 0}}},
                negativeSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$data.original', true]}, {$lte: ['$data.sentiment', sentimentConfig.negative]}, {$gt: ['$data.sentiment', sentimentConfig.veryNegative]}]}, then: 1, else: 0}}},
                veryNegativeSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$data.original', true]}, {$lte: ['$data.sentiment', sentimentConfig.veryNegative]}]}, then: 1, else: 0}}}
            }},
            // sort by word count
            {$sort: {wordCount: -1}},
            // group by gram count
            {$group: {
                _id: '$_id.gramSize',
                totalCount: {$sum: '$totalCount'},
                totalSentiment: {$sum: '$totalSentiment'},
                veryPositiveSentiment: {$sum: '$veryPositiveSentiment'},
                positiveSentiment: {$sum: '$positiveSentiment'},
                neutralSentiment: {$sum: '$neutralSentiment'},
                negativeSentiment: {$sum: '$negativeSentiment'},
                veryNegativeSentiment: {$sum: '$veryNegativeSentiment'},
                totalGramCount: {$sum: '$gramCount'},
                ngrams: {$push: {word: '$_id.word', count: '$wordCount', sentiment: '$sentiment'}}
            }},
            // calc only keep top 25 ngrams
            {$project: {
                _id: true, 
                totalCount: true, 
                totalSentiment: true, veryPositiveSentiment: true, positiveSentiment: true, neutralSentiment: true, negativeSentiment: true, veryNegativeSentiment: true, 
                totalGramCount: true, ngrams: {$slice: ['$ngrams', 25]}
            }},
            // group all
            {$group: {
                _id: null,
                totalCount: {$sum: '$totalCount'},
                totalSentiment: {$sum: '$totalSentiment'},
                veryPositiveSentiment: {$sum: '$veryPositiveSentiment'},
                positiveSentiment: {$sum: '$positiveSentiment'},
                neutralSentiment: {$sum: '$neutralSentiment'},
                negativeSentiment: {$sum: '$negativeSentiment'},
                veryNegativeSentiment: {$sum: '$veryNegativeSentiment'},
                ngrams: {$push: {gramSize: '$_id', totalGramCount: '$totalGramCount', ngrams: '$ngrams'}}
            }},
            // final output
            {$project: {
                count: '$totalCount', 
                sentiment: {
                    avg: {$divide: [{$sum: '$totalSentiment'}, {$sum: '$totalCount'}]},
                    veryPositive: '$veryPositiveSentiment',
                    positive: '$positiveSentiment',
                    neutral: '$neutralSentiment',
                    negative: '$negativeSentiment',
                    veryNegative: '$veryNegativeSentiment'
                }, 
                ngrams: true
            }}
        ];

        // perform analysis
        function performAnalysis() {

            // pipeline print out
            if (process.env.SERVER === 'local') {
                fs.writeFile(
                    'server/modules/analysis/util/analysis.util.socialmedia.pipeline.json',
                    JSON.stringify(pipeline, null, 4)
                );
            }
            
            // aggregation analysis
            SocialMedia.aggregate(
                pipeline,
                function(err, resultDocs) {
                    if (err) { return clbk(new Error(err)); }
                    if (!resultDocs) { return clbk(new Error('!resultDocs')); }
                    if (!resultDocs.length) { return clbk(); }
                    if (resultDocs.length !== 1) { 
                        err = new Error('resultDocs.length !== 1');
                        err.resultDocs = resultDocs;
                        return clbk(err); 
                    }

                    // clean up results
                    var results = resultDocs[0];
                    if (results.ngrams && results.ngrams.constructor === Array) {
                        var newNgramResults = {};
                        results.ngrams.forEach(function(ngramObj) {
                            if (ngramObj.gramSize) {
                                newNgramResults[ngramObj.gramSize.toString()] = ngramObj.ngrams.map(function(ngram) {
                                    if (ngram.count && ngramObj.totalGramCount) { ngram.frequency = ngram.count / ngramObj.totalGramCount; }
                                    ngram.sentimentClass = getSentimentClass(ngram.sentiment);
                                    return ngram;
                                });
                            }
                        });
                        results.ngrams = newNgramResults;
                    }
                    
                    // done
                    return clbk(null, results);
                }
            );
        }
        
        // check channel
        function checkChannel() {
            switch (query.channel) {
                case 'all social media':
                    performAnalysis();
                    break;
                case 'district social media':
                    getSeedIds(query, function(err, seedIds) {
                        if (err) { return clbk(err); }
                        if (!seedIds) { return clbk(new Error('!seedIds')); }
                        if (!seedIds.length) { return clbk(new Error('!seedIds.length')); }
                        pipeline[0].$match.socialseed = {$in: seedIds};
                        performAnalysis();
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