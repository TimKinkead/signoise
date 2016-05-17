'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    District = mongoose.model('District'),
    County = mongoose.model('County'),
    State = mongoose.model('State'),
    SocialMedia = mongoose.model('SocialMedia');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error/index'),
    logger = require('../../logger/index');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Add related twitter seed to state doc.
 * @param stateId - state doc _id
 * @param seedId - social seed doc _id
 * @param clbk - return clbk(err)
 */
function updateState(stateId, seedId, clbk) {
    if (!stateId) { return clbk(new Error('!stateId')); }
    if (!seedId) { return clbk(new Error('!seedId')); }
    State.update(
        {_id: stateId},
        {$addToSet: {relatedTwitterSeeds: seedId}},
        function(err) {
            if (err) { return clbk(new Error(err)); }
            return clbk();
        }
    );
}

/**
 * Add related twitter seed to county doc.
 * @param countyId - county doc _id
 * @param seedId - social seed doc _id
 * @param clbk - return clbk(err)
 */
function updateCounty(countyId, seedId, clbk) {
    if (!countyId) { return clbk(new Error('!countyId')); }
    if (!seedId) { return clbk(new Error('!seedId')); }
    County.update(
        {_id: countyId},
        {$addToSet: {relatedTwitterSeeds: seedId}},
        function(err) {
            if (err) { return clbk(new Error(err)); }
            return clbk();
        }
    );
}

/**
 * Add related twitter seed to district docs.
 * @param districtIds - array of district doc _ids
 * @param seedId - social seed doc _id
 * @param clbk - return clbk(err)
 */
function updateDistricts(districtIds, seedId, clbk) {
    if (!districtIds) { return clbk(new Error('!districtIds')); }
    if (!districtIds.length) { return clbk(); }
    if (!seedId) { return clbk(new Error('!seedId')); }
    District.update(
        {_id: {$in: districtIds}},
        {$addToSet: {relatedTwitterSeeds: seedId}},
        {multi: true},
        function(err) {
            if (err) { return clbk(new Error(err)); }
            return clbk();
        }
    );
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.UPDATE.DISTRICT.RELATED
 * - Update related social media for all districts.
 * - Run this once in a while.
 */
exports.updateDistrictRelated = function(req, res) {
    logger.filename(__filename);

    var d = new Date(),
        d1 = new Date(d.getFullYear()-1, d.getMonth(), 1),
        d2 = new Date(d.getFullYear(), d.getMonth(), 1),
        seedIds = [],
        seedMap = {},
        screenNames = [],
        snMap = {},
        districts = 0,
        counties = 0,
        countyMap = {};

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Update District Related Social Media Error!',
            message: message || 'We had trouble updating the district related social media. Please try again.'
        });
    }

    // get state
    logger.dash('getting state');
    State.findOne({name: 'california'})
        .select('_id')
        .exec(function(err, stateDoc) {
            if (err) { error.log(new Error(err)); errorMessage(); return; }
            if (!stateDoc) { error.log(new Error('!stateDoc')); errorMessage(); return; }
            logger.arrow('done');
            
            // get all districts
            logger.dash('getting districts');
            District.find({state: stateDoc._id})
                .select('_id county state twitterSeed')
                .exec(function(err, districtDocs) {
                    if (err) { error.log(new Error(err)); errorMessage(); return; }
                    if (!districtDocs) { error.log(new Error('!districtDocs')); errorMessage(); return; }
                    logger.arrow('done');
                    
                    // grab twitter seed ids & construct seed map
                    districtDocs.forEach(function(district) {
                        if (district.twitterSeed) {
                            districts++;
                            seedIds.push(district.twitterSeed);
                            if (!seedMap[district.twitterSeed]) { seedMap[district.twitterSeed] = {districts: [district]}; }
                            else { seedMap[district.twitterSeed].districts.push(district); }
                        }
                    });

                    // aggregate district social media to determine related accounts from user_mentions
                    logger.arrow('aggregating social media');
                    SocialMedia.aggregate(
                        [
                            {$match: {socialseed: {$in: seedIds}, date: {$gte: d1, $lt: d2}}},
                            {$unwind: {path: '$data.entities.user_mentions'}},
                            {$group: {_id: {socialseed: '$socialseed', screen_name: '$data.entities.user_mentions.screen_name'}, user_mentions: {$sum: 1}}},
                            {$match: {user_mentions: {$gte: 25}}},
                            {$sort: {user_mentions: -1}},
                            {$group: {_id: '$_id.socialseed', relatedScreenNames: {$push: '$_id.screen_name'}}}
                        ],
                        function(err, seedResultDocs) {
                            if (err) { error.log(new Error(err)); errorMessage(); return; }
                            if (!seedResultDocs) { error.log(new Error('!seedResultDocs'));errorMessage(); return; }
                            logger.arrow('done');
                            
                            // construct screen names array & screen name map
                            seedResultDocs.forEach(function(seed) {
                                if (seed.relatedScreenNames && seed.relatedScreenNames.length) {
                                    seed.relatedScreenNames.forEach(function(sn) {
                                        if (screenNames.indexOf(sn) < 0) { screenNames.push(sn); }
                                        if (!snMap[sn]) { snMap[sn] = {districtIds: [], countyIds: []}; }
                                        seedMap[seed._id].districts.forEach(function(district) {
                                            if (district._id && snMap[sn].districtIds.indexOf(district._id) < 0) {
                                                snMap[sn].districtIds.push(district._id);
                                            }
                                            if (district.county && snMap[sn].countyIds.indexOf(district.county) < 0) {
                                                snMap[sn].countyIds.push(district.county);
                                            }
                                        });
                                    });
                                }
                            });

                            // get district count by county
                            logger.dash('aggregating districts');
                            District.aggregate(
                                [
                                    {$match: {twitterSeed: {$exists: true}}},
                                    {$group: {_id: '$county', count: {$sum: 1}}}
                                ],
                                function(err, distResultDocs) {
                                    if (err) { error.log(new Error(err)); return errorMessage(); }
                                    if (!distResultDocs) { error.log(new Error('!distResultDocs')); return errorMessage(); }
                                    logger.arrow('done');
                                    
                                    // construct county map
                                    distResultDocs.forEach(function(county) {
                                        counties++;
                                        countyMap[county._id] = county.count;
                                    });

                                    // respond to client
                                    res.status(200).send('Working on updating district related social media.');

                                    logger.log(districts+' districts');
                                    logger.log(counties+' counties');
                                    
                                    // save screen names
                                    var index = 0;
                                    logger.dash('saving screen names');
                                    function saveScreenName() {

                                        function nextScreenName(delay) {
                                            index++;
                                            if (index+1 > screenNames.length) {
                                                logger.arrow('done');
                                                logger.arrow('update district related complete');
                                                return;
                                            }
                                            if (delay) {
                                                setTimeout(function() { saveScreenName(); }, 1000*60*delay);
                                                return;
                                            }
                                            saveScreenName();
                                        }

                                        var screenName = screenNames[index],
                                            sn = (screenName) ? snMap[screenName] : null;

                                        if (!sn) { nextScreenName(); return; }
                                        if (!sn.districtIds) { error.log(new Error('!sn.districtIds')); nextScreenName(); return; }
                                        if (!sn.districtIds.length) { nextScreenName(); return; }
                                        
                                        // get seed id for screen name
                                        request.post(
                                            {
                                                url: url.parse('http://'+req.get('host')+'/data/socialseed'),
                                                json: true,
                                                body: {platform: 'twitter', twitter: {query: '@'+screenNames[index]}, frequency: 'daily'}
                                            },
                                            function(err, response, body) {
                                                // error logged by socialseed.create
                                                if (!body || !body._id) { error.log(new Error('!body || !body._id')); nextScreenName(); return; }
                                                sn.socialseed = body._id;

                                                if (sn.countyIds.length > 1) { logger.log(sn.countyIds.length+' countyIds'); }
                                                if (sn.districtIds.length > 1) { logger.log(sn.districtIds.length+' districtIds'); }
                                                
                                                // district specific
                                                if (seedMap[sn.socialseed]) { nextScreenName(); }
                                                
                                                // state related
                                                else if (sn.countyIds.length > 0.25*counties || (sn.countyIds.length > 0.10*counties && sn.districtIds.length > 0.25*districts)) {
                                                    updateState(stateDoc._id, sn.socialseed, function(err) {
                                                        if (err) { error.log(err); }
                                                        else { logger.tab('('+(index+1)+'/'+screenNames.length+') '+screenName+' saved - state related'); }
                                                        nextScreenName();
                                                    });
                                                }

                                                // county related
                                                else if (sn.countyIds.length === 1 && sn.districtIds.length > 0.25*countyMap[sn.countyIds[0]]) {
                                                    updateCounty(sn.countyIds[0], sn.socialseed, function (err) {
                                                        if (err) { error.log(err); }
                                                        else { logger.tab('('+(index+1)+'/'+screenNames.length+') screen name saved - county related'); }
                                                        nextScreenName();
                                                    });
                                                }

                                                // district related
                                                else {
                                                    updateDistricts(sn.districtIds, sn.socialseed, function(err) {
                                                        if (err) { error.log(err); }
                                                        else { logger.tab('('+(index+1)+'/'+screenNames.length+') screen name saved - district related'); }
                                                        nextScreenName();
                                                    });
                                                }
                                            }
                                        );
                                    }

                                    // start saving process
                                    saveScreenName();
                                }
                            );
                        }
                    );
                });
        });
};