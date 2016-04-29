'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var fs = require('fs');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    District = mongoose.model('District'),
    Topic = mongoose.model('Topic'),
    State = mongoose.model('State'),
    County = mongoose.model('County');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error/index'),
    logger = require('../../logger/index');

//----------------------------------------------------------------------------------------------------------------------
// Variables

// sentiment config
var sentimentConfig = require('./analysis.sentiment.config').sentimentConfig;

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
                if (query.channel === 'district social media') {
                    if (cV.facebookSeed) { seedIds.push(cV.facebookSeed); }
                    if (cV.twitterSeed) { seedIds.push(cV.twitterSeed); }
                } else if (query.channel === 'district related social media') {
                    if (cV.relatedTwitterSeeds) { seedIds = seedIds.concat(cV.relatedTwitterSeeds); }
                }
            });

            // done
            return clbk(null, seedIds);
        }
    );
}

/**
 * Get geo json for state or county.
 * @param query - req.query
 * @param clbk - return clbk(err, geoJsonGeom)
 */
function getGeoJson(query, clbk) {
    if (!query) { return clbk(new Error('!query')); }
    
    // get geo json for county
    if (query.county) {
        County.findById(query.county)
            .select('geometry')
            .exec(function(err, countyDoc) {
                if (err || !countyDoc) {
                    err = new Error(err || '!countyDoc');
                    err.county = query.county;
                    return clbk(err);
                }
                return clbk(null, countyDoc.geometry);
            });
    } 
    
    // get geo json for state
    else if (query.state) {
        State.findById(query.state)
            .select('geometry')
            .exec(function(err, stateDoc) {
                if (err || !stateDoc) {
                    err = new Error(err || '!stateDoc');
                    err.state = query.state;
                    return clbk(err);
                }
                return clbk(null, stateDoc.geometry);
            });
    }
        
    // all location-based media
    else { return clbk(new Error('!query.county && !query.state')); }
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * ANALYSIS.SOCIALMEDIA
 * - Perform social media analysis and return results. (sentiment or ngrams)
 * @param query - req.query
 * @param clbk - return clbk(err, results)
 */
exports.analyzeSocialMedia = function(query, clbk) {
    //logger.filename(__filename);
    
    if (!query) { return clbk(new Error('!query')); }
    if (!query.minDate) { return clbk(new Error('!query.minDate')); }
    if (!query.maxDate) { return clbk(new Error('!query.maxDate')); }
    if (!query.channel) { return clbk(new Error('!query.channel')); }
    
    function dataProjection(no, bool) {
        return {
            sentiment: '$sentiment',
            gramSize: '$ngrams.'+no+'.gramSize',
            gramCount: '$ngrams.'+no+'.gramCount',
            word: '$ngrams.'+no+'.sorted.word',
            wordCount: '$ngrams.'+no+'.sorted.count',
            useForGrandTotals: (no === 1) ? {$cond: {if: {$eq: ['$index1', 0]}, then: true, else: false}} : {$literal: false},
            useForNgramTotals: (no === 1) ? {$cond: {if: {$eq: ['$index1', 0]}, then: true, else: false}} : {$literal: bool}
        };
    }
        
    // aggregation pipeline setup
    var pipeline = [
        // match documents
        {$match: {
            date: {$gte: query.minDate, $lt: query.maxDate},
            sentimentProcessed: {$exists: true},
            ngramsProcessed: {$exists: true}
        }},
        // unwind ngrams.1
        {$unwind: {path: '$ngrams.1.sorted', includeArrayIndex: 'index1', preserveNullAndEmptyArrays: true}},
        {$project: {
            data: [dataProjection(1)],
            sentiment: true,
            ngrams: {$cond: {if: {$eq: ['$index1', 0]}, then: '$ngrams', else: {$literal: {'2': {sorted: [{word: null, count: 0}]}}}}}
        }},
        // unwind ngrams.2
        {$unwind: {path: '$ngrams.2.sorted', includeArrayIndex: 'index2', preserveNullAndEmptyArrays: true}},
        {$project: {
            data: {$cond: {if: {$or: [{$eq: ['$index2', 0]}, {$eq: ['$index2', null]}]}, then: {$concatArrays: ['$data', [dataProjection(2, true)]]}, else: [dataProjection(2, false)]}},
            sentiment: true,
            ngrams: {$cond: {if: {$eq: ['$index2', 0]}, then: '$ngrams', else: {$literal: {'3': {sorted: [{word: null, count: 0}]}}}}}
        }},
        // unwind ngrams.3
        {$unwind: {path: '$ngrams.3.sorted', includeArrayIndex: 'index3', preserveNullAndEmptyArrays: true}},
        {$project: {
            data: {$cond: {if: {$or: [{$eq: ['$index3', 0]}, {$eq: ['$index3', null]}]}, then: {$concatArrays: ['$data', [dataProjection(3, true)]]}, else: [dataProjection(3, false)]}},
            sentiment: true,
            ngrams: {$cond: {if: {$eq: ['$index3', 0]}, then: '$ngrams', else: {$literal: {'4': {sorted: [{word: null, count: 0}]}}}}}
        }},
        // unwind ngrams.4
        {$unwind: {path: '$ngrams.4.sorted', includeArrayIndex: 'index4', preserveNullAndEmptyArrays: true}},
        {$project: {
            data: {$cond: {if: {$or: [{$eq: ['$index4', 0]}, {$eq: ['$index4', null]}]}, then: {$concatArrays: ['$data', [dataProjection(4, true)]]}, else: [dataProjection(4, false)]}}
        }},
        // unwind data field
        {$unwind: {path: '$data'}},
        // tag with sentiment class
        {$project: {
            data: true,
            sentimentClass: {$cond: {if: {$gte: ['$data.sentiment', sentimentConfig.positive]}, then: 'positive', else: {
                $cond: {if: {$lte: ['$data.sentiment', sentimentConfig.negative]}, then: 'negative', else: 'neutral'}}
            }}}
        },
        // group by sentiment class / gram size / ngram word
        {$group: {
            _id: {sentimentClass: '$sentimentClass', gramSize: '$data.gramSize', word: '$data.word'},
            gramCount: {$sum: {$cond: {if: {$eq: ['$data.useForNgramTotals', true]}, then: '$data.gramCount', else: 0}}},
            wordCount: {$sum: '$data.wordCount'},
            totalCount: {$sum: {$cond: {if: {$eq: ['$data.useForGrandTotals', true]}, then: 1, else: 0}}},
            totalSentiment: {$sum: {$cond: {if: {$eq: ['$data.useForGrandTotals', true]}, then: '$data.sentiment', else: 0}}},
            positiveSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$data.useForGrandTotals', true]}, {$gte: ['$data.sentiment', sentimentConfig.positive]}]}, then: 1, else: 0}}},
            neutralSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$data.useForGrandTotals', true]}, {$gt: ['$data.sentiment', sentimentConfig.negative]}, {$lt: ['$data.sentiment', sentimentConfig.positive]}]}, then: 1, else: 0}}},
            negativeSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$data.useForGrandTotals', true]}, {$lte: ['$data.sentiment', sentimentConfig.negative]}]}, then: 1, else: 0}}}
        }},
        // sort by word count
        {$sort: {wordCount: -1}},
        // group by sentiment class / gram size
        {$group: {
            _id: {sentimentClass: '$_id.sentimentClass', gramSize: '$_id.gramSize'},
            totalCount: {$sum: '$totalCount'},
            totalSentiment: {$sum: '$totalSentiment'},
            positiveSentiment: {$sum: '$positiveSentiment'},
            neutralSentiment: {$sum: '$neutralSentiment'},
            negativeSentiment: {$sum: '$negativeSentiment'},
            totalGramCount: {$sum: '$gramCount'},
            ngrams: {$push: {word: '$_id.word', count: '$wordCount'}}
        }},
        // only keep top 100 ngrams
        {$project: {
            _id: true,
            totalCount: true,
            totalSentiment: true,
            positiveSentiment: true,
            neutralSentiment: true,
            negativeSentiment: true,
            totalGramCount: true,
            ngrams: {$slice: ['$ngrams', 100]}
        }},
        // group by sentiment class
        {$group: {
            _id: '$_id.sentimentClass',
            totalCount: {$sum: '$totalCount'},
            totalSentiment: {$sum: '$totalSentiment'},
            positiveSentiment: {$sum: '$positiveSentiment'},
            neutralSentiment: {$sum: '$neutralSentiment'},
            negativeSentiment: {$sum: '$negativeSentiment'},
            data: {$push: {gramSize: '$_id.gramSize', totalGramCount: '$totalGramCount', ngrams: '$ngrams'}}
        }},
        // group all
        {$group: {
            _id: null,
            totalCount: {$sum: '$totalCount'},
            totalSentiment: {$sum: '$totalSentiment'},
            positiveSentiment: {$sum: '$positiveSentiment'},
            neutralSentiment: {$sum: '$neutralSentiment'},
            negativeSentiment: {$sum: '$negativeSentiment'},
            ngrams: {$push: {sentimentClass: '$_id', data: '$data'}}
        }},
        // final output
        {$project: {
            count: '$totalCount',
            sentiment: {
                average: {$cond: {if: {$gt: ['$totalCount', 0]}, then: {$divide: ['$totalSentiment', '$totalCount']}, else: null}},
                positive: '$positiveSentiment',
                neutral: '$neutralSentiment',
                negative: '$negativeSentiment'
            },
            ngrams: true
        }}
    ];

    // perform analysis
    function performAnalysis() {

        // pipeline print out
        if (process.env.SERVER === 'local') {
            fs.writeFile(
                'temp/analysis.pipeline.json',
                JSON.stringify(pipeline, null, 4)
            );
        }

        // aggregation analysis
        SocialMedia.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(function(err, resultDocs) {
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
                        if (ngramObj.sentimentClass) {
                            if (!newNgramResults[ngramObj.sentimentClass]) {
                                newNgramResults[ngramObj.sentimentClass] = {all: []};
                                if (ngramObj.data && ngramObj.data.constructor === Array) {
                                    ngramObj.data.forEach(function(ngramSubObj) {
                                        if (ngramSubObj.gramSize) {
                                            if (!newNgramResults[ngramObj.sentimentClass][ngramSubObj.gramSize.toString()]) {
                                                newNgramResults[ngramObj.sentimentClass][ngramSubObj.gramSize.toString()] = {
                                                    totalGramCount: ngramSubObj.totalGramCount,
                                                    ngrams: ngramSubObj.ngrams.map(function(ngram) {
                                                        ngram.frequency = ngram.count / ngramSubObj.totalGramCount;
                                                        return ngram;
                                                    })
                                                };
                                                newNgramResults[ngramObj.sentimentClass].all =
                                                    newNgramResults[ngramObj.sentimentClass].all.concat(
                                                        newNgramResults[ngramObj.sentimentClass][ngramSubObj.gramSize.toString()].ngrams
                                                    );
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    });
                    results.ngrams = newNgramResults;
                } else {
                    results.ngrams = null;
                }

                // done
                return clbk(null, results);
            });
    }

    // get full topic doc
    function getTopic() {
        if (!query.topic) { performAnalysis(); return; }
        Topic.findById(query.topic, function(err, topicDoc) {
            if (err) { return clbk(new Error(err)); }
            if (!topicDoc) { return clbk(new Error('!topicDoc')); }
            if (!topicDoc.keywords) { return clbk(new Error('!topicDoc.keywords')); }
            if (!topicDoc.keywords.length) { return clbk(new Error('!topicDoc.keywords.length')); }
            if (!topicDoc.simpleKeywords) { return clbk(new Error('!topicDoc.simpleKeywords')); }
            if (!topicDoc.simpleKeywords.length) { return clbk(new Error('!topicDoc.simpleKeywords.length')); }

            pipeline[0].$match.$text = {$search: topicDoc.simpleKeywords};
            pipeline[0].$match.$or = [
                {'ngrams.1.sorted.word': {$in: topicDoc.ngrams['1']}},
                {'ngrams.2.sorted.word': {$in: topicDoc.ngrams['2']}},
                {'ngrams.3.sorted.word': {$in: topicDoc.ngrams['3']}},
                {'ngrams.4.sorted.word': {$in: topicDoc.ngrams['4']}}
            ];
            performAnalysis();
        });
    }

    // start by checking channel
    switch (query.channel) {
        case 'all social media':
            if (query.state || query.county) {
                getGeoJson(query, function(err, geoJsonGeom) {
                    if (err) { return clbk(err); }
                    if (!geoJsonGeom) { return clbk(new Error('!geoJsonGeom')); }
                    pipeline[0].$match.location = {$geoWithin: {$geometry: geoJsonGeom}};
                    getTopic();
                });
            } else {
                getTopic();
            }
            break;
        case 'district social media':
        case 'district related social media':
            getSeedIds(query, function(err, seedIds) {
                if (err) { return clbk(err); }
                if (!seedIds) { return clbk(new Error('!seedIds')); }
                if (!seedIds.length) { return clbk(null, {count: 0}); }
                pipeline[0].$match.socialseed = {$in: seedIds};
                getTopic();
            });
            break;
        default:
            return clbk(new Error('channel "'+query.channel+'" is not supported'));
    }
};