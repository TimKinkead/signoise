'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    State = mongoose.model('State'),
    County = mongoose.model('County'),
    SocialSeed = mongoose.model('SocialSeed');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * INIT.SOCIALSEEDS.RELATED
 * - Find or create social seeds for each screen name.
 * - Add screen name to 'relatedTwitterSeeds' for state or county.
 */
exports.relatedSocialSeeds = function(req, res) {
    logger.filename(__filename);

    var snList = require('../data/twitter.screen_names');
    
    snList.forEach(function(cV) {

        // county
        if (cV.county && cV.state) {
            logger.bold(cV.county);

            // get state
            State.findOne({name: cV.state})
                .select('_id')
                .exec(function(err, stateDoc) {
                    if (err) { error.log(new Error(err)); return; }
                    if (!stateDoc) { error.log(new Error('!stateDoc')); return; }
                    if (!stateDoc._id) { error.log(new Error('!stateDoc._id')); return; }

                    // get county
                    County.findOne({name: cV.county, state: stateDoc._id})
                        .select('_id')
                        .exec(function(err, countyDoc) {
                            if (err) { error.log(new Error(err)); return; }
                            if (!countyDoc) { error.log(new Error('!countyDoc')); return; }
                            if (!countyDoc._id) { error.log(new Error('!countyDoc._id')); return; }

                            // get social seeds for screen names
                            cV.screen_names.forEach(function(sn) {
                                request.post(
                                    {
                                        url: url.parse('http://'+req.get('host')+'/data/socialseed'),
                                        json: true,
                                        body: {'platform': 'twitter', twitter: {query: '@'+sn}, 'frequency': 'daily'}
                                    },
                                    function(err, response, body) {
                                        // error logged by socialseed.create
                                        if (!body || !body._id) { error.log(new Error('!body || !body._id')); return; }

                                        // add social seeds to county's relatedTwitterSeeds
                                        County.update(
                                            {_id: countyDoc._id},
                                            {$addToSet: {relatedTwitterSeeds: body._id}},
                                            function(err) {
                                                if (err) { error.log(new Error(err)); }
                                                logger.log('county updated');
                                            }
                                        );
                                    }
                                );
                            });
                        });
                });
        }
        
        // state
        else if (cV.state) {
            
            // get state
            State.findOne({name: cV.state})
                .select('_id')
                .exec(function(err, stateDoc) {
                    if (err) { error.log(new Error(err)); return; }
                    if (!stateDoc) { error.log(new Error('!stateDoc')); return; }
                    if (!stateDoc._id) { error.log(new Error('!stateDoc._id')); return; }
                    
                    // get social seeds for screen names
                    cV.screen_names.forEach(function(sn) {
                        request.post(
                            {
                                url: url.parse('http://'+req.get('host')+'/data/socialseed'),
                                json: true,
                                body: {'platform': 'twitter', twitter: {query: '@'+sn}, 'frequency': 'daily'}
                            },
                            function(err, response, body) {
                                // error logged by socialseed.create
                                if (!body || !body._id) { error.log(new Error('!body || !body._id')); return; }
                                
                                // add social seeds to state's relatedTwitterSeeds
                                State.update(
                                    {_id: stateDoc._id},
                                    {$addToSet: {relatedTwitterSeeds: body._id}},
                                    function(err) {
                                        if (err) { error.log(new Error(err)); }
                                    }
                                );
                            }
                        );     
                    });
                });
        }
    });

    // done
    return res.status(200).send('Working on adding related Twitter social seeds to counties and states.');
};