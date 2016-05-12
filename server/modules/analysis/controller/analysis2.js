'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    Analysis2 = mongoose.model('Analysis2'),
    Topic = mongoose.model('Topic'),
    SocialSeed = mongoose.model('SocialSeed'),
    SocialMedia = mongoose.model('SocialMedia'),
    District = mongoose.model('District'),
    County = mongoose.model('County'),
    State = mongoose.model('State');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error/index'),
    logger = require('../../logger/index');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var networkWeightConfig = {
    district: 0.57, // 57%
    related: 0.29, // 29%
    geographic: 0.14 // 14%
};

/**
 *
 * @param date
 * @param topic
 * @param state
 * @param clbk
 */
function calcDistricts(date, topic, state, clbk) {
    logger.dash('calculating \'district\' social media');

    var seedIds = [],
        seedMap = {},
        results = [];
    
    // get districts
    District.find({state: state._id})
        .populate('twitterSeed', '_id media')
        .exec(function(err, districtDocs) {
            if (err) { return clbk([new Error(err)]); }
            if (!districtDocs) { return clbk([new Error('!districtDocs')]); }
            if (!districtDocs.length) { return clbk([new Error('!districtDocs.length')]); }

            // grab seed ids & construct seed map
            districtDocs.forEach(function (cV) {
                if (cV && cV.twitterSeed && cV.twitterSeed._id) {
                    seedIds.push(cV.twitterSeed._id);
                    if (!seedMap[cV.twitterSeed._id.toString()]) { seedMap[cV.twitterSeed.id.toString()] = []; }
                    seedMap[cV.twitterSeed._id.toString()].push(cV);
                }
            });
            
            // aggregate district social media
            SocialMedia.aggregate([
                {$match: {
                    date: {$gte: date.minDate, $lt: date.maxDate},
                    $text: {$search: topic.simpleKeywords},
                    $or: [
                        {'ngrams.1.sorted.word': {$in: topic.ngrams['1']}},
                        {'ngrams.2.sorted.word': {$in: topic.ngrams['2']}},
                        {'ngrams.3.sorted.word': {$in: topic.ngrams['3']}},
                        {'ngrams.4.sorted.word': {$in: topic.ngrams['4']}}
                    ],
                    socialseed: {$in: seedIds},
                    sentimentProcessed: {$exists: true},
                    ngramsProcessed: {$exists: true}
                }},
                {$group: {
                    _id: '$socialseed',
                    count: {$sum: 1},
                    totalCount: {$max: '$data.user.statuses_count'},
                    sentiment: {$avg: '$sentiment'},
                    followerCount: {$max: '$data.user.followers_count'}
                }}
            ])
                .allowDiskUse(true)
                .exec(function(err, resultDocs) {
                    if (err) { return clbk([new Error(err)]); }
                    if (!resultDocs) { return clbk([new Error('!resultDocs')]); }

                    // clean up results
                    resultDocs.forEach(function(cV) {
                        if (cV && cV._id) {
                            var districts = seedMap[cV._id.toString()];
                            if (districts && districts.length) {
                                districts.forEach(function(district) {
                                    results.push({
                                        type: (date.maxDate.getMonth()+1)+'/'+date.maxDate.getDate()+'/'+date.maxDate.getFullYear()+' annual',
                                        minDate: date.minDate,
                                        maxDate: date.maxDate,
                                        channel: 'district',
                                        topic: topic._id,
                                        state: district.state,
                                        county: district.county,
                                        district: district._id,
                                        socialseed: cV._id,
                                        networkType: 'district',
                                        networkWeight: (networkWeightConfig.district/resultDocs.length)/districts.length,
                                        //rankWeight: // calculate later: (followers/totalFollowers[districts+related+geographic])/duplicates
                                        followerCount: cV.followerCount,
                                        count: cV.count,
                                        totalCount: cV.totalCount,
                                        sentiment: cV.sentiment
                                    });
                                });
                            }
                        }
                    });

                    // done
                    logger.arrow('done');
                    return clbk(null, results);
                });
        });
}

/**
 *
 * @param date
 * @param topic
 * @param state
 * @param clbk
 */
function calcRelated(date, topic, state, clbk) {
    logger.dash('calculating \'related\' social media');
    
    var seedIds = [],
        seedMap = {},
        results = [];

    // get districts
    District.find({state: state._id})
        .populate('relatedTwitterSeeds', '_id media')
        .exec(function(err, districtDocs) {
            if (err) { return clbk([new Error(err)]); }
            if (!districtDocs) { return clbk([new Error('!districtDocs')]); }
            if (!districtDocs.length) { return clbk([new Error('!districtDocs.length')]); }

            // grab seed ids & construct seed map
            districtDocs.forEach(function (cV) {
                if (cV && cV.relatedTwitterSeeds) {
                    cV.relatedTwitterSeeds.forEach(function(seed) {
                        if (seed._id) {
                            seedIds.push(seed._id);
                            if (!seedMap[seed._id.toString()]) { seedMap[seed.id.toString()] = []; }
                            seedMap[seed._id.toString()].push(cV);     
                        }
                    });
                }
            });

            // aggregate related social media
            SocialMedia.aggregate([
                {$match: {
                    date: {$gte: date.minDate, $lt: date.maxDate},
                    $text: {$search: topic.simpleKeywords},
                    $or: [
                        {'ngrams.1.sorted.word': {$in: topic.ngrams['1']}},
                        {'ngrams.2.sorted.word': {$in: topic.ngrams['2']}},
                        {'ngrams.3.sorted.word': {$in: topic.ngrams['3']}},
                        {'ngrams.4.sorted.word': {$in: topic.ngrams['4']}}
                    ],
                    socialseed: {$in: seedIds},
                    sentimentProcessed: {$exists: true},
                    ngramsProcessed: {$exists: true}
                }},
                {$group: {
                    _id: '$socialseed',
                    count: {$sum: 1},
                    totalCount: {$max: '$data.user.statuses_count'},
                    sentiment: {$avg: '$sentiment'},
                    followerCount: {$max: '$data.user.followers_count'}
                }}
            ])
                .allowDiskUse(true)
                .exec(function(err, resultDocs) {
                    if (err) { return clbk([new Error(err)]); }
                    if (!resultDocs) { return clbk([new Error('!resultDocs')]); }

                    // clean up results
                    resultDocs.forEach(function(cV) {
                        if (cV && cV._id) {
                            var districts = seedMap[cV._id.toString()];
                            if (districts && districts.length) {
                                districts.forEach(function(district) {
                                    results.push({
                                        type: (date.maxDate.getMonth()+1)+'/'+date.maxDate.getDate()+'/'+date.maxDate.getFullYear()+' annual',
                                        minDate: date.minDate,
                                        maxDate: date.maxDate,
                                        channel: 'related',
                                        topic: topic._id,
                                        state: district.state,
                                        county: district.county,
                                        district: district._id,
                                        socialseed: cV._id,
                                        networkType: 'related',
                                        networkWeight: (networkWeightConfig.related/resultDocs.length)/districts.length,
                                        //rankWeight: // calculate later: (followers/totalFollowers[districts+related+geographic])/duplicates
                                        followerCount: cV.followerCount,
                                        count: cV.count,
                                        totalCount: cV.totalCount,
                                        sentiment: cV.sentiment
                                    });
                                });
                            }
                        }
                    });

                    // done
                    logger.arrow('done');
                    return clbk(null, results);
                });
        });
}

/**
 *
 * @param date
 * @param topic
 * @param state
 * @param clbk
 */
function calcGeographic(date, topic, state, clbk) {
    logger.dash('calculating \'geographic\' social media');

    var seedIds = [],
        results = [];

    var cnt, errs = [];
    function done() {
        if (!errs.length) { errs = null; }
        results.forEach(function(cV) {
            cV.networkWeight =  (networkWeightConfig.geographic / results.length);
        });
        logger.arrow('done');
        return clbk(errs, results);
    }

    // aggregate geographic social media
    var countyIndex = 0, counties = [];
    function aggregateCountySocialMedia() {

        function nextCounty(delay) {
            countyIndex++;
            if (countyIndex >= counties.length) { done(); return; }
            if (delay) { setTimeout(function() { aggregateCountySocialMedia(); }, 1000*60*delay); return; }
            aggregateCountySocialMedia();
        }

        var county = counties[countyIndex];
        if (!county) { nextCounty(); }
        logger.log('  '+county.name);

        SocialMedia.aggregate([
            {
                $match: {
                    date: {$gte: date.minDate, $lt: date.maxDate},
                    $text: {$search: topic.simpleKeywords},
                    $and: [
                        {$or: [
                            {'ngrams.1.sorted.word': {$in: topic.ngrams['1']}},
                            {'ngrams.2.sorted.word': {$in: topic.ngrams['2']}},
                            {'ngrams.3.sorted.word': {$in: topic.ngrams['3']}},
                            {'ngrams.4.sorted.word': {$in: topic.ngrams['4']}}
                        ]},
                        {$or: [
                            {location: {$geoWithin: {$geometry: county.geometry}}},
                            {socialseed: {$in: county.relatedTwitterSeeds}}
                        ]}
                    ],
                    socialseed: {$nin: seedIds},
                    sentimentProcessed: {$exists: true},
                    ngramsProcessed: {$exists: true}
                }
            },
            {
                $group: {
                    _id: '$socialseed',
                    count: {$sum: 1},
                    totalCount: {$max: '$data.user.statuses_count'},
                    sentiment: {$avg: '$sentiment'},
                    followerCount: {$max: '$data.user.followers_count'}
                }
            }
        ])
            .allowDiskUse(true)
            .exec(function (err, resultDocs) {
                if (err) { errs.push(new Error(err)); nextCounty(1); return; }
                if (!resultDocs) { errs.push(new Error('!resultDocs')); nextCounty(1); return; }

                // clean up results
                resultDocs.forEach(function (cV) {
                    if (cV && cV._id) {
                        results.push({
                            type: (date.maxDate.getMonth() + 1) + '/' + date.maxDate.getDate() + '/' + date.maxDate.getFullYear() + ' annual',
                            minDate: date.minDate,
                            maxDate: date.maxDate,
                            channel: 'geographic',
                            topic: topic._id,
                            state: state._id,
                            county: county._id,
                            socialseed: cV._id,
                            networkType: 'geographic',
                            //networkWeight: // calculate later: (networkWeightConfig['geographic'] / results.length),
                            //rankWeight: // calculate later: (followers/totalFollowers[districts+related+geographic])/duplicates
                            followerCount: cV.followerCount,
                            count: cV.count,
                            totalCount: cV.totalCount,
                            sentiment: cV.sentiment
                        });
                    }
                });

                // done
                nextCounty();
            });
    }

    // get district seeds & related seeds
    District.find({state: state._id})
        .exec(function(err, districtDocs) {
            if (err) { return clbk([new Error(err)]); }
            if (!districtDocs) { return clbk([new Error('!districtDocs')]); }
            if (!districtDocs.length) { return clbk([new Error('!districtDocs.length')]); }

            // grab seed ids
            districtDocs.forEach(function (cV) {
                if (cV.twitterSeed && seedIds.indexOf(cV.twitterSeed) < 0) { seedIds.push(cV.twitterSeed); }
                if (cV.relatedTwitterSeeds) {
                    cV.relatedTwitterSeeds.forEach(function(seedId) {
                        if (seedIds.indexOf(seedId) < 0) { seedIds.push(seedId); }
                    });
                }
            });

            // get counties
            County.find({state: state._id})
                .exec(function(err, countyDocs) {
                    if (err) { return clbk([new Error(err)]); }
                    if (!countyDocs) { return clbk([new Error('!countyDocs')]); }
                    if (!countyDocs.length) { return clbk([new Error('!countyDocs.length')]); }

                    // aggregate geographic social media
                    counties = countyDocs;
                    aggregateCountySocialMedia();
                });
        });
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * ANALYSIS.ANALYSIS2
 * - Calculate weights for social seeds.
 * - Network Type Weight: district seeds (57%), related district seeds (29%), geographic seeds (14%)
 * - Network Rank Weight: seed followers / total followers in network
 * - Run this once in a while to update.
 */
exports.analysis2 = function(req, res) {
    logger.filename(__filename);

    var allAnalysisDocs = [],
        d = new Date(),
        date = {
            minDate: new Date(d.getFullYear()-1, d.getMonth(), 1),
            maxDate: new Date(d.getFullYear(), d.getMonth(), 1)
        };

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Analysis2 Error!',
            message: message || 'We had trouble performing the analysis. Please try again.'
        });
    }

    var cnt;
    function checkDone() {
        cnt -= 1;
        if (cnt <= 0) {
            logger.arrow('analysis2 complete');
            return res.status(200).send('Analysis2 complete.');
        }
    }
    
    // wipe analysis2 collection
    Analysis2.remove({}, function(err) {
        if (err) { error.log(new Error(err)); errorMessage(); return; }

        // get topic
        Topic.findOne({name: 'common core'})
            .exec(function(err, topicDoc) {
                if (err) { error.log(new Error(err)); errorMessage(); return; }
                if (!topicDoc) { error.log(new Error('!topicDoc')); errorMessage(); return; }

                // get state
                State.findOne({name: 'california'})
                    .select('_id')
                    .exec(function(err, stateDoc) {
                        if (err) { error.log(new Error(err)); errorMessage(); return; }
                        if (!stateDoc) { error.log(new Error('!stateDoc')); errorMessage(); return; }

                        // perform analysis for 'district' social media
                        calcDistricts(date, topicDoc, stateDoc, function(errs, districtAnalysisDocs) {
                            if (errs && errs.length) { errs.forEach(function(err) { error.log(err); }); }
                            if (districtAnalysisDocs) { allAnalysisDocs = allAnalysisDocs.concat(districtAnalysisDocs); }

                            // perform analysis for 'related' social media
                            calcRelated(date, topicDoc, stateDoc, function(errs, relatedAnalysisDocs) {
                                if (errs && errs.length) { errs.forEach(function(err) { error.log(err); }); }
                                if (relatedAnalysisDocs) { allAnalysisDocs = allAnalysisDocs.concat(relatedAnalysisDocs); }

                                // perform analysis for 'geographic' social media
                                calcGeographic(date, topicDoc, stateDoc, function(errs, geographicAnalysisDocs) {
                                    if (errs && errs.length) { errs.forEach(function(err) { error.log(err); }); }
                                    if (geographicAnalysisDocs) { allAnalysisDocs = allAnalysisDocs.concat(geographicAnalysisDocs); }

                                    // construct duplicate map & count total followers
                                    var duplicates = {},
                                        totalFollowers = 0;
                                    allAnalysisDocs.forEach(function(cV) { 
                                        if (duplicates[cV.socialseed.toString()]) { 
                                            duplicates[cV.socialseed.toString()]++; 
                                        } else { 
                                            duplicates[cV.socialseed.toString()] = 1; 
                                            totalFollowers += cV.followerCount;
                                        }
                                    });

                                    // save analysis docs
                                    cnt = allAnalysisDocs.length;
                                    logger.dash('saving analysis docs');
                                    allAnalysisDocs.forEach(function(cV) { 
                                        cV.rankWeight = (cV.followerCount/totalFollowers)/duplicates[cV.socialseed.toString()];
                                        Analysis2.create(cV, function(err, newAnalysisDoc) {
                                            if (err) { error.log(new Error(err)); }
                                            if (!newAnalysisDoc) { error.log(new Error('!newAnalysisDoc')); }
                                            checkDone();
                                        });
                                    });
                                });
                            });
                        });
                    });
            });
    });
};