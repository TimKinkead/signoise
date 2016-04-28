'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    fs = require('fs'),
    _ = require('lodash'); 

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    County = mongoose.model('County'),
    State = mongoose.model('State');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Upsert a county doc for each county.
 */
function upsertCounties() {
    
    var counties = require('../data/counties.json').features,
        countyIndex = 0;

    // create counties
    function createCounty() {

        function nextCounty() {
            if ((countyIndex+1) >= counties.length) {
                return logger.bold('Done creating ' + counties.length + ' counties.');
            }
            countyIndex++;
            createCounty();
        }

        // error handling
        if (!counties[countyIndex]) { error.log(new Error('!counties['+countyIndex+']')); nextCounty(); return; }
        if (!counties[countyIndex].properties) { error.log(new Error('!counties['+countyIndex+'].properties')); nextCounty(); return; }
        if (!counties[countyIndex].properties.NAME) { error.log(new Error('!counties['+countyIndex+'].properties.NAME')); nextCounty(); return; }
        if (!counties[countyIndex].properties.STATE) { error.log(new Error('!counties['+countyIndex+'].properties.STATE')); nextCounty(); return; }
        if (!counties[countyIndex].geometry) { error.log(new Error('!counties['+countyIndex+'].geometry')); nextCounty(); return; }

        // init county
        var county = {
            name: counties[countyIndex].properties.NAME.toLowerCase(),
            state: counties[countyIndex].properties.STATE,
            code: counties[countyIndex].properties.COUNTY,
            geoId: counties[countyIndex].properties.GEO_ID,
            geometry: counties[countyIndex].geometry,
            bounds: [[], []] // [[sw lng, sw lat], [ne lng, ne lat]]
        };

        // calc bounds
        function calcBounds(coords) {
            if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                var lng = coords[0], lat = coords[1];
                if (!county.bounds[0][0]) { county.bounds[0][0] = lng; }
                if (!county.bounds[0][1]) { county.bounds[0][1] = lat; }
                if (!county.bounds[1][0]) { county.bounds[1][0] = lng; }
                if (!county.bounds[1][1]) { county.bounds[1][1] = lat; }
                if (lng < county.bounds[0][0]) { county.bounds[0][0] = lng; }
                if (lat < county.bounds[0][1]) { county.bounds[0][1] = lat; }
                if (lng > county.bounds[1][0]) { county.bounds[1][0] = lng; }
                if (lat > county.bounds[1][1]) { county.bounds[1][1] = lat; }
            }
            if (coords.length !== 2 && coords.constructor === Array) {
                coords.forEach(function(subCoords) { calcBounds(subCoords); });
            }
        }
        if (county.geometry && county.geometry.coordinates && county.geometry.coordinates.length) {
            calcBounds(county.geometry.coordinates);
        }

        // get state
        State.findOne({code: county.state})
            .exec(function(err, stateDoc) {
                if (err) { error.log(new Error(err)); nextCounty(); return; }
                if (!stateDoc) { error.log(new Error('!stateDoc')); nextCounty(); return; }

                // set county.state to stateDoc._id
                county.state = stateDoc._id;

                // check if county already exists
                County.findOne({name: county.name, state: county.state})
                    .exec(function(err, countyDoc) {
                        if (err) { error.log(new Error(err)); nextCounty(); return; }

                        // update county if it exists
                        if (countyDoc) {
                            countyDoc = _.extend(countyDoc, county);
                            countyDoc.modified = new Date();
                        }

                        // otherwise create new county
                        else {
                            countyDoc = new County(county);
                        }

                        // save new or updated county doc
                        countyDoc.save(function(err) {
                            if (err) { error.log(new Error(err)); nextCounty(); return; }

                            // done
                            logger.result(county.name+' created');
                            nextCounty();
                        });
                    });
            });
    }

    // start process
    createCounty();
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * INIT.COUNTIES
 * - Download data and save to '../data/counties.json'
 * - Upsert a county doc for each county.
 */
exports.counties = function(req, res) {
    logger.filename(__filename);

    // download counties.json
    request('http://eric.clst.org/wupl/Stuff/gz_2010_us_050_00_5m.json') // http://eric.clst.org/Stuff/USGeoJSON
        .pipe(fs.createWriteStream('./server/modules/init/data/counties.json'))
        .on('error', function(err) {
            error.log(new Error(err));
            return res.status(500).send(err);
        })
        .on('close', function() {
            upsertCounties();
            return res.status(200).send('Working on initializing counties.');
        });
};