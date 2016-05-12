'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash'),
    request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
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

function calcDistrictWeights(state, clbk) {
    logger.dash('calcDistrictWeights');

    var networkType = 'district';
    
    var cnt, errs = [];
    function checkDone() {
        cnt -= 1;
        if (cnt <= 0) {
            if (!errs.length) { errs = null; }
            logger.arrow('done calculating district weights');
            return clbk(errs);
        }
    }

    function updateSeed(_id, networkWeight, impactWeight) {
        SocialSeed.update(
            {_id: _id},
            {$set: {networkType: networkType, networkWeight: networkWeight, impactWeight: impactWeight}},
            function(err) {
                if (err) { errs.push(new Error(err)); } 
                checkDone();
            }
        );
    }

    // get all districts
    District.find({state: state})
        .select('twitterSeed')
        .populate('twitterSeed', '_id twitter.followerCount')
        .exec(function(err, districtDocs) {
            if (err) { return clbk([new Error(err)]); }
            if (!districtDocs) { return clbk([new Error('!districtDocs')]); }
            if (!districtDocs.length) { return clbk([new Error('!districtDocs.length')]); }

            // grab twitter seed ids & count total followers
            var totalSeeds = 0,
                totalFollowers = 0;
            districtDocs.forEach(function(cV) {
                if (cV && cV.twitterSeed && cV.twitterSeed._id && cV.twitterSeed.twitter && cV.twitterSeed.twitter.followerCount) {
                    totalSeeds++;
                    totalFollowers += cV.twitterSeed.twitter.followerCount;
                }
            });

            // update weights for each seed
            logger.arrow(totalSeeds+' total seeds');
            cnt = districtDocs.length;
            districtDocs.forEach(function(cV) {
                if (cV && cV.twitterSeed && cV.twitterSeed._id && cV.twitterSeed.twitter && cV.twitterSeed.twitter.followerCount) {
                    updateSeed(cV.twitterSeed._id, networkWeightConfig[networkType]/totalSeeds, cV.twitterSeed.twitter.followerCount/totalFollowers);
                } else {
                    checkDone();
                }
            });
        });
}

function calcRelatedWeights(state, clbk) {
    logger.dash('calcRelatedWeights');

    var networkType = 'related';
    
    var cnt = 0, errs = [];
    function checkDone() {
        cnt -= 1;
        if (cnt <= 0) {
            if (!errs.length) { errs = null; }
            logger.arrow('done calculating related weights');
            return clbk(errs);
        }
    }

    function updateSeed(_id, networkWeight, impactWeight) {
        SocialSeed.update(
            {_id: _id},
            {$set: {networkType: networkType, networkWeight: networkWeight, impactWeight: impactWeight}},
            function(err) {
                if (err) { errs.push(new Error(err)); }
                checkDone();
            }
        );
    }

    // get all districts
    District.find({state: state})
        .select('relatedTwitterSeeds')
        .populate('relatedTwitterSeeds', '_id twitter.followerCount')
        .exec(function(err, districtDocs) {
            if (err) { return clbk([new Error(err)]); }
            if (!districtDocs) { return clbk([new Error('!districtDocs')]); }
            if (!districtDocs.length) { return clbk([new Error('!districtDocs.length')]); }

            // grab twitter seed ids & count total followers
            var totalSeeds = 0,
                totalFollowers = 0;
            districtDocs.forEach(function(district) {
                if (district && district.relatedTwitterSeeds && district.relatedTwitterSeeds.length) {
                    district.relatedTwitterSeeds.forEach(function(seed) {
                        if (seed && seed._id && seed.twitter && seed.twitter.followerCount) {
                            cnt++;
                            totalSeeds++;
                            totalFollowers += seed.twitter.followerCount;
                        }
                    });
                }
            });

            // update weights for each seed
            logger.arrow(totalSeeds+' total seeds');
            districtDocs.forEach(function(district) {
                if (district && district.relatedTwitterSeeds && district.relatedTwitterSeeds.length) {
                    district.relatedTwitterSeeds.forEach(function(seed) {
                        if (seed && seed._id && seed.twitter && seed.twitter.followerCount) {
                            updateSeed(seed._id, networkWeightConfig[networkType]/totalSeeds, seed.twitter.followerCount/totalFollowers);
                        }
                    });
                }
            });
            if (!cnt) { checkDone(); }
        });
}

function calcGeographicWeights(state, geometry, clbk) {
    logger.dash('calcGeographicWeights');
    
    var networkType = 'geographic';

    var cnt, errs = [];
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            if (!errs.length) { errs = null; }
            logger.arrow('done calculating geographic weights');
            return clbk(errs);
        }
    }

    function updateSeed(_id, networkWeight, impactWeight) {
        SocialSeed.update(
            {_id: _id},
            {$set: {networkType: networkType, networkWeight: networkWeight, impactWeight: impactWeight}},
            function(err) {
                if (err) { errs.push(new Error(err)); }
                checkDone();
            }
        );
    }
    
    // get all district & related seedIds
    District.find({state: state})
        .select('twitterSeed relatedTwitterSeeds')
        .exec(function(err, districtDocs) {
            if (err) { return clbk([new Error(err)]); }
            if (!districtDocs) { return clbk([new Error('!districtDocs')]); }
            if (!districtDocs.length) { return clbk([new Error('!districtDocs.length')]); }

            // grab seed ids
            var seedIds = [];
            districtDocs.forEach(function(cV) {
                if (cV) {
                    if (cV.twitterSeed) { seedIds.push(cV.twitterSeed); }
                    if (cV.relatedTwitterSeeds) { seedIds = seedIds.concat(cV.relatedTwitterSeeds); }
                }
            });

            // construct aggregation pipeline
            var pipeline = [
                {$match: {
                    platform: 'twitter',
                    location: {$geoWithin: {$geometry: geometry}},
                    socialseed: {$nin: seedIds}
                }},
                {$group: {_id: '$socialseed', followerCount: {$max: '$data.user.followers_count'}}}
            ];

            // aggregate social media
            SocialMedia.aggregate(pipeline)
                .allowDiskUse(true)
                .exec(function(err, resultDocs) {
                    if (err) { return clbk([new Error(err)]); }
                    if (!resultDocs) { return clbk([new Error('!resultDocs')]); }
                    if (!resultDocs.length) { return clbk([new Error('!resultDocs.length')]); }
                    
                    // count total followers
                    var totalSeeds = 0,
                        totalFollowers = 0;
                    resultDocs.forEach(function(cV) {
                        if (cV && cV._id && cV.followerCount) {
                            totalSeeds += 1;
                            totalFollowers += cV.followerCount;
                        }
                    });
                    
                    // update weights for each seed
                    logger.arrow(totalSeeds+' total seeds');
                    cnt = resultDocs.length;
                    resultDocs.forEach(function(cV) {
                        if (cV && cV._id && cV.followerCount) {
                            updateSeed(cV._id, networkWeightConfig[networkType]/totalSeeds, cV.followerCount/totalFollowers);
                        } else {
                            checkDone();
                        }
                    });
                });
        });
}

function calcWeights(state, geometry, clbk) {

    var seeds = [],
        seedIds = [],
        seedCount = {district: 0, related: 0, geographic: 0},
        totalFollowers = 0;
    
    // check done
    var cnt, errs = [];
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            if (!errs.length) { errs = null; }
            logger.arrow('done calculating weights');
            return clbk(errs);
        }
    }

    // update seed weights
    function updateSeed(seed) {
        SocialSeed.update(
            {_id: seed._id},
            {$set: {
                networkType: seed.networkType, 
                networkWeight: seed.networkWeight, 
                impactWeight: seed.impactWeight,
                state: seed.state,
                county: seed.county,
                district: seed.district
            }},
            function(err) {
                if (err) { errs.push(new Error(err)); }
                checkDone();
            }
        );
    }

    // get district & related seeds
    District.find({state: state})
        .select('twitterSeed relatedTwitterSeeds')
        .populate('twitterSeed', '_id twitter.followerCount')
        .populate('relatedTwitterSeeds', '_id twitter.followerCount')
        .exec(function(err, districtDocs) {
            if (err) { return clbk([new Error(err)]); }
            if (!districtDocs) { return clbk([new Error('!districtDocs')]); }
            if (!districtDocs.length) { return clbk([new Error('!districtDocs.length')]); }

            // grab seeds & count total followers
            districtDocs.forEach(function (district) {
                if (district) {
                    if (district.twitterSeed && district.twitterSeed._id && district.twitterSeed.twitter.followerCount) {
                        var districtSeed = _.extend(district.twitterSeed, {type: 'district', state: district.state, county: district.county, district: district._id});
                        if (seedIds.indexOf(districtSeed._id) < 0) {
                            seedIds.push(districtSeed._id);
                            seeds.push(districtSeed);
                            seedCount.district++;
                            totalFollowers += districtSeed.twitter.followerCount;
                        }
                    }
                    if (district.relatedTwitterSeeds && district.relatedTwitterSeeds.length) {
                        district.relatedTwitterSeeds.forEach(function (seed) {
                            if (seed && seed._id && seed.twitter && seed.twitter.followerCount) {
                                seed = _.extend(seed, {type: 'related', state: district.state, county: district.county, district: district._id});
                                if (seedIds.indexOf(seed._id) < 0) {
                                    seedIds.push(seed._id);
                                    seeds.push(seed);
                                    seedCount.related++;
                                    totalFollowers += seed.twitter.followerCount;   
                                }
                            }
                        });
                    }
                }
            });

            // get geographic seeds
            SocialMedia.aggregate([
                    {$match: {
                        platform: 'twitter',
                        location: {$geoWithin: {$geometry: geometry}},
                        socialseed: {$nin: seedIds}
                    }},
                    {$group: {_id: '$socialseed', followerCount: {$max: '$data.user.followers_count'}}},
                    {$project: {_id: '$_id', twitter: {followerCount: '$followerCount'}}}
                ])
                .allowDiskUse(true)
                .exec(function(err, resultDocs) {
                    if (err) { return clbk([new Error(err)]); }
                    if (!resultDocs) { return clbk([new Error('!resultDocs')]); }
                    if (!resultDocs.length) { return clbk([new Error('!resultDocs.length')]); }

                    // grab seeds & count total followers
                    resultDocs.forEach(function(cV) {
                        if (cV && cV._id && cV.twitter && cV.twitter.followerCount) {
                            if (seedIds.indexOf(cV._id) < 0) {
                                seedIds.push(cV._id);
                                cV.type = 'geographic';
                                seeds.push(cV);
                                seedCount.geographic++;
                                totalFollowers += cV.twitter.followerCount;
                            }
                        }
                    });
                    
                    // update weights for each seed
                    logger.arrow(seeds.length+' total seeds');
                    cnt = seeds.length;
                    seeds.forEach(function(seed) {
                        if (seed && seed._id && seed.type && seed.twitter && seed.twitter.followerCount) {
                            updateSeed(seed._id, seed.type, networkWeightConfig[seed.type]/seedCount[seed.type], seed.twitter.followerCount/totalFollowers);   
                        } else {
                            checkDone();
                        }
                    });
                });
        });
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALSEED.CALCULATE.WEIGHTS
 * - Calculate weights for social seeds.
 * - Seed Rank: seed followers / total followers in network
 * - Network Weight: district seeds (57%), related district seeds (29%), geographic seeds (14%)
 * - Run this once in a while to update.
 */
exports.calculateWeights = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Calculate Weights Error!',
            message: message || 'We had trouble calculating the social seed weights. Please try again.'
        });
    }

    // unset network metrics
    SocialSeed.update(
        {networkType: {$exists: true}},
        {$unset: {networkType: true, networkWeight: true, impactWeight: true, state: true, county: true, district: true}},
        {multi: true},
        function(err) {
            if (err) { error.log(new Error(err)); errorMessage(); return; }
    
            // get state
            State.findOne({name: 'california'}, function(err, stateDoc) {
                if (err) { error.log(new Error(err)); errorMessage(); return; }
                if (!stateDoc) { error.log(new Error('!stateDoc')); errorMessage(); return; }
                
                // calc weights
                calcWeights(stateDoc._id, stateDoc.geometry, function(errs) {
                    if (errs && errs.length) {
                        errs.forEach(function(err) { error.log(err); });
                        
                    }
                    
                    
                    // update counties
                    
                });
            });
        }
    );
};