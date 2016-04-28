'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    fs = require('fs'),
    _ = require('lodash'); 

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    State = mongoose.model('State');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Upsert a state doc for each state.
 */
function upsertStates() {
    
    var states = require('../data/states.json').features,
        stateAbbreviations = require('../data/state.abbreviations.json'),
        stateIndex = 0;

    // create states
    function createState() {

        function nextState() {
            if ((stateIndex+1) >= states.length) {
                logger.bold('Done creating ' + states.length + ' states.');
                return;
            }
            stateIndex++;
            createState();
        }

        // error handling
        if (!states[stateIndex]) { error.log(new Error('!states['+stateIndex+']')); nextState(); return; }
        if (!states[stateIndex].properties) { error.log(new Error('!states['+stateIndex+'].properties')); nextState(); return; }
        if (!states[stateIndex].properties.NAME) { error.log(new Error('!states['+stateIndex+'].properties.NAME')); nextState(); return; }
        if (!states[stateIndex].geometry) { error.log(new Error('!states['+stateIndex+'].geometry')); nextState(); return; }

        // init state
        var state = {
            name: states[stateIndex].properties.NAME.toLowerCase(),
            abbv: stateAbbreviations[states[stateIndex].properties.NAME],
            code: states[stateIndex].properties.STATE,
            geoId: states[stateIndex].properties.GEO_ID,
            geometry: states[stateIndex].geometry,
            bounds: [[], []] // [[sw lng, sw lat], [ne lng, ne lat]]
        };

        // calc bounds
        function calcBounds(coords) {
            if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                var lng = coords[0], lat = coords[1];
                if (!state.bounds[0][0]) { state.bounds[0][0] = lng; }
                if (!state.bounds[0][1]) { state.bounds[0][1] = lat; }
                if (!state.bounds[1][0]) { state.bounds[1][0] = lng; }
                if (!state.bounds[1][1]) { state.bounds[1][1] = lat; }
                if (lng < state.bounds[0][0]) { state.bounds[0][0] = lng; }
                if (lat < state.bounds[0][1]) { state.bounds[0][1] = lat; }
                if (lng > state.bounds[1][0]) { state.bounds[1][0] = lng; }
                if (lat > state.bounds[1][1]) { state.bounds[1][1] = lat; }
            }
            if (coords.length !== 2 && coords.constructor === Array) {
                coords.forEach(function(subCoords) { calcBounds(subCoords); });
            }
        }
        if (state.geometry && state.geometry.coordinates && state.geometry.coordinates.length) {
            calcBounds(state.geometry.coordinates);
        }

        // check if state already exists
        State.findOne({name: state.name})
            .exec(function(err, stateDoc) {
                if (err) { error.log(new Error(err)); nextState(); return; }

                // update state if it exists
                if (stateDoc) {
                    stateDoc = _.extend(stateDoc, state);
                    stateDoc.modified = new Date();
                }

                // otherwise create new state
                else {
                    stateDoc = new State(state);
                }

                // save new or updated state doc
                stateDoc.save(function(err) {
                    if (err) { error.log(new Error(err)); nextState(); return; }

                    // done
                    logger.result(state.name+' created');
                    nextState();
                });
            });
    }

    // start process
    createState();
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * INIT.STATES
 * - Download data and save to '../data/states.json'
 * - Upsert a state doc for each state.
 */
exports.states = function(req, res) {
    logger.filename(__filename);

    // download states.json
    request('http://eric.clst.org/wupl/Stuff/gz_2010_us_040_00_5m.json') // http://eric.clst.org/Stuff/USGeoJSON
        .pipe(fs.createWriteStream('./server/modules/init/data/states.json'))
        .on('error', function(err) {
            error.log(new Error(err));
            return res.status(500).send(err);
        })
        .on('close', function() {
            upsertStates();
            return res.status(200).send('Working on initializing states.');
        });
};