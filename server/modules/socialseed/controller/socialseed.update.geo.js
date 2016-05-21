'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialSeed = mongoose.model('SocialSeed'),
    State = mongoose.model('State'),
    County = mongoose.model('County');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALSEED.UPDATE.GEO
 * - Update social seed state & county per user data, if possible.
 */
exports.updateGeo = function(req, res) {
    logger.filename(__filename);

    var stateMap = {}, // {california: {...}
        statesById = {}, // {ObjectId('123'): 'california'}
        statesByAbbv = {}, // {CA: 'california'}
        oneWeekAgo = (function() { var d = new Date(); d.setDate(d.getDate()-7); return d; })(),
        limit = 1000;
    
    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Update Social Seed Geo Error!',
            message: message || 'We had trouble updating social seed states & counties. Please try again.'
        });
    }

    // get states
    State.find({})
        .select('_id name abbv')
        .exec(function(err, stateDocs) {
            if (err) { error.log(new Error(err)); errorMessage(); return; }
            if (!stateDocs) { error.log(new Error('!stateDocs')); errorMessage(); return; }
            if (!stateDocs.length) { error.log(new Error('!stateDocs.length')); errorMessage(); return; }

            // construct state maps
            stateDocs.forEach(function(stateDoc) {
                if (!stateDoc) { return; }
                if (stateDoc.name) {
                    stateMap[stateDoc.name] = stateDoc;
                    stateMap[stateDoc.name].counties = {};
                }
                if (stateDoc._id) { statesById[stateDoc._id] = stateDoc.name; }
                if (stateDoc.abbv) { statesByAbbv[stateDoc.abbv] = stateDoc.name; }
            });

            // get counties
            County.find({})
                .select('_id name state')
                .exec(function(err, countyDocs) {
                    if (err) { error.log(new Error(err)); errorMessage(); return; }
                    if (!countyDocs) { error.log(new Error('!countyDocs')); errorMessage(); return; }
                    if (!countyDocs.length) { error.log(new Error('!countyDocs.length')); errorMessage(); return; }

                    // add counties to state map
                    countyDocs.forEach(function(countyDoc) {
                        if (!countyDoc || !countyDoc.name || !countyDoc.state) { return; }
                        if (!stateMap[statesById[countyDoc.state]] || stateMap[statesById[countyDoc.state]].counties) { return; }
                        stateMap[statesById[countyDoc.state]].counties[countyDoc.name] = countyDoc;
                    });

                    // get seeds
                    logger.dash('getting seeds');
                    SocialSeed.find({
                        'twitter.type': 'screen_name',
                        $and: [
                            {$or: [
                                {'data.location': {$exists: true, $ne: ''}},
                                {'data.description': {$exists: true, $ne: ''}}
                            ]},
                            {$or: [
                                {geoUpdated: {$exists: false}},
                                {geoUpdated: {$lt: oneWeekAgo}}
                            ]}
                        ],
                        geoProtected: {$ne: true}
                    })
                        .limit(limit)
                        .exec(function(err, seedDocs) {
                            if (err) { error.log(new Error(err)); errorMessage(); return; }
                            if (!seedDocs) { error.log(new Error('!seedDocs')); errorMessage(); return; }
                            if (!seedDocs.length) { res.status(200).send('No seeds to update right now.'); return; }
                            logger.arrow(seedDocs.length+' seeds');

                            seedDocs.forEach(function(seed, index) {
                                var i, x,
                                    loc = seed.data.location || '',
                                    loc1grams,
                                    loc2grams = [],
                                    desc = seed.data.description || '',
                                    desc1grams,
                                    desc2grams = [],
                                    ngrams,
                                    state = null,
                                    county = null;

                                // construct ngram arrays
                                loc1grams = loc.split(' ');
                                loc1grams.forEach(function(cV, i) {
                                    if (loc1grams[i+1]) { loc2grams.push(cV+' '+loc1grams[i+1]); }
                                });
                                desc1grams = desc.split(' ');
                                desc1grams.forEach(function(cV, i) {
                                    if (desc1grams[i+1]) { desc2grams.push(cV+' '+desc1grams[i+1]); }
                                });
                                ngrams = loc2grams.concat(loc1grams).concat(desc2grams).concat(desc1grams);

                                // state
                                for (i=0, x=ngrams.length; i<x; i++) {
                                    if (stateMap[ngrams[i].toLowerCase()]) {
                                        state = stateMap[ngrams[i].toLowerCase()];
                                        break;
                                    } else if (/[A-Z]{2}/.test(ngrams[i]) && statesByAbbv[ngrams[i]]) {
                                        state = stateMap[statesByAbbv[ngrams[i]]];
                                        break;
                                    }
                                }
                                if (!state) { return; }

                                // county
                                if (/county/i.test(loc+' '+desc)) {
                                    for (i=0, x=ngrams.length; i<x; i++) {
                                        if (state.counties[ngrams[i].toLowerCase()]) {
                                            county = state.counties[ngrams[i].toLowerCase()];
                                            break;
                                        }
                                    }
                                }

                                // update seed
                                var update = {$set: {geoUpdated: new Date()}};
                                if (state && !seed.state) { update.$set.state = state._id; }
                                if (county && !seed.county) { update.$set.county = county._id; }
                                SocialSeed.update(
                                    {_id: seed._id},
                                    update,
                                    function(err) {
                                        if (err) { error.log(new Error(err)); }
                                        if (index === 0 || index%10 === 0 || index+1 === limit) {
                                            logger.tab((index+1)+'/'+seedDocs.length+' seed updated ('+Math.round((index+1)/seedDocs.length*100)+'%)');
                                        }
                                    }
                                );
                            });

                            return res.status(200).send('Working on updating seed state/county.');
                        });
                });
        });
};