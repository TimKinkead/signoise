'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var fs = require('fs');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    SocialSeed = mongoose.model('SocialSeed'),
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
 * Get social seed ids for districts in a specific state/county.
 * @param query - req.query
 * @param clbk - return clbk(err, results)
 */
function getDistrictSeedIds(query, clbk) {
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
                    if (cV.relatedFacebookSeeds) { seedIds = seedIds.concat(cV.relatedFacebookSeeds); }
                }
            });

            // done
            return clbk(null, seedIds);
        }
    );
}

/**
 * Get social seed ids for a specific state/county.
 * @param query - req.query
 * @param clbk - return clbk(err, results)
 */
function getGeoSeedIds(query, clbk) {
    if (!query) { return clbk(new Error('!query')); }
    if (!query.state && !query.county) { return clbk(new Error('!query.state && !query.county')); }
    
    var mongoQuery = {};
    if (query.state) { mongoQuery.state = query.state; }
    if (query.county) { mongoQuery.county = query.county; }
    
    SocialSeed.find(
        mongoQuery,
        function(err, seedDocs) {
            if (err) { return clbk(new Error(err)); }
            if (!seedDocs) { return clbk(new Error('!seedDocs')); }

            // remap & return seed ids
            return clbk(seedDocs.map(function(cV) { return cV._id; }));
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
        
    // aggregation pipeline setup
    var pipeline = [
        // match documents (multiple $match operations get squashed) - http://stackoverflow.com/questions/30475401/mongodb-3-0-aggregation-several-matches-vs-one-match-with-multiple-items
        {$match: {
            date: {$gte: query.minDate, $lt: query.maxDate},
            sentimentProcessed: {$exists: true},
            ngramsProcessed: {$exists: true}
        }},
        // unwind ngrams
        {$unwind: {path: '$ngrams.all', includeArrayIndex: 'index', preserveNullAndEmptyArrays: true}},
        // tag with sentiment class
        {$project: {
            word: '$ngrams.all.word',
            gramSize: '$ngrams.all.gramSize',
            sentimentClass: {$cond: {if: {$gte: ['$sentiment', sentimentConfig.positive]}, then: 'positive', else: {
                $cond: {if: {$lte: ['$sentiment', sentimentConfig.negative]}, then: 'negative', else: 'neutral'}
            }}},
            wordCount: '$ngrams.all.count',
            totalGramCount: {$cond: {if: {$gt: ['$ngrams.all.count', 0]}, then: {$divide: ['$ngrams.all.count', '$ngrams.all.gramCount']}, else: 0}},
            totalCount: {$cond: {if: {$eq: ['$index', 0]}, then: 1, else: 0}},
            totalSentiment: {$cond: {if: {$eq: ['$index', 0]}, then: '$sentiment', else: 0}}
        }},
        // group by word / gram size / sentiment class
        {$group: {
            _id: {word: '$word', gramSize: '$gramSize', sentimentClass: '$sentimentClass'},
            wordCount: {$sum: '$wordCount'},
            totalGramCount: {$sum: '$totalGramCount'},
            totalCount: {$sum: '$totalCount'},
            totalSentiment: {$sum: '$totalSentiment'},
            positiveSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$totalCount', 1]}, {$gte: ['$totalSentiment', sentimentConfig.positive]}]}, then: 1, else: 0}}},
            neutralSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$totalCount', 1]}, {$gt: ['$totalSentiment', sentimentConfig.negative]}, {$lt: ['$totalSentiment', sentimentConfig.positive]}]}, then: 1, else: 0}}},
            negativeSentiment: {$sum: {$cond: {if: {$and: [{$eq: ['$totalCount', 1]}, {$lte: ['$totalSentiment', sentimentConfig.negative]}]}, then: 1, else: 0}}}
        }},
        // sort by word count
        {$sort: {wordCount: -1}},
        // group by gram size / sentiment class
        {$group: {
            _id: {gramSize: '$_id.gramSize', sentimentClass: '$_id.sentimentClass'},
            ngrams: {$push: {word: '$_id.word', count: '$wordCount'}},
            totalGramCount: {$sum: '$totalGramCount'},
            totalCount: {$sum: '$totalCount'},
            totalSentiment: {$sum: '$totalSentiment'},
            positiveSentiment: {$sum: '$positiveSentiment'},
            neutralSentiment: {$sum: '$neutralSentiment'},
            negativeSentiment: {$sum: '$negativeSentiment'}
        }},
        // only keep top 100 ngrams
        {$project: {
            _id: true,
            ngrams: {$slice: ['$ngrams', 100]},
            totalGramCount: true,
            totalCount: true,
            totalSentiment: true,
            positiveSentiment: true,
            neutralSentiment: true,
            negativeSentiment: true
        }},
        // group by sentiment class
        {$group: {
            _id: '$_id.sentimentClass',
            data: {$push: {gramSize: '$_id.gramSize', ngrams: '$ngrams', totalGramCount: '$totalGramCount'}},
            totalCount: {$sum: '$totalCount'},
            totalSentiment: {$sum: '$totalSentiment'},
            positiveSentiment: {$sum: '$positiveSentiment'},
            neutralSentiment: {$sum: '$neutralSentiment'},
            negativeSentiment: {$sum: '$negativeSentiment'}
        }},
        // group all
        {$group: {
            _id: null,
            ngrams: {$push: {sentimentClass: '$_id', data: '$data'}},
            totalCount: {$sum: '$totalCount'},
            totalSentiment: {$sum: '$totalSentiment'},
            positiveSentiment: {$sum: '$positiveSentiment'},
            neutralSentiment: {$sum: '$neutralSentiment'},
            negativeSentiment: {$sum: '$negativeSentiment'}
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
                if (resultDocs.length > 1) { return clbk(new Error('resultDocs.length > 1')); }

                var results = resultDocs[0] || {count: 0};

                // clean up ngrams
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
            pipeline[0].$match['ngrams.all.word'] = {$in: topicDoc.ngrams.all};
            performAnalysis();
        });
    }

    // start by checking channel
    switch (query.channel) {

        case 'all social media':
            if (query.state || query.county) {
                // get geographic seed ids
                getGeoSeedIds(query, function(err, geoSeedIds) {
                    if (err) { return clbk(err); }
                    if (!geoSeedIds) { return clbk(new Error('!geoSeedIds')); }
                    // get geojson data
                    getGeoJson(query, function(err, geoJsonGeom) {
                        if (err) { return clbk(err); }
                        if (!geoJsonGeom) { return clbk(new Error('!geoJsonGeom')); }
                        // set $match params
                        pipeline[0].$match.$or = [
                            {socialseed: {$in: geoSeedIds}},
                            {location: {$geoWithin: {$geometry: geoJsonGeom}}}
                        ];
                        getTopic();
                    });
                });            
            } else {
                getTopic();
            }
            break;

        case 'geographic social media':
            if (query.state || query.county) {
                // get district seed ids
                getDistrictSeedIds(query, function(err, districtSeedIds) {
                    if (err) { return clbk(err); }
                    if (!districtSeedIds) { return clbk(new Error('!districtSeedIds')); }
                    if (!districtSeedIds.length) { pipeline[0].$match.socialseed = {$nin: districtSeedIds}; }
                    // get geographic seed ids
                    getGeoSeedIds(query, function(err, geoSeedIds) {
                        if (err) { return clbk(err); }
                        if (!geoSeedIds) { return clbk(new Error('!geoSeedIds')); }
                        // get geojson data
                        getGeoJson(query, function(err, geoJsonGeom) {
                            if (err) { return clbk(err); }
                            if (!geoJsonGeom) { return clbk(new Error('!geoJsonGeom')); }
                            // set $match params
                            pipeline[0].$match.$or = [
                                {socialseed: {$in: geoSeedIds}},
                                {location: {$geoWithin: {$geometry: geoJsonGeom}}}
                            ];
                            getTopic();
                        });
                    });
                });
            } else {
                pipeline[0].$match.$or = [{state: {$exists: true}}, {location: {$exists: true}}];
                getTopic();
            }
            break;
        
        case 'district social media':
        case 'district related social media':
            getDistrictSeedIds(query, function(err, seedIds) {
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