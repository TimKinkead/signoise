'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    County = mongoose.model('County');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * COUNTY.LIST.GEOJSON
 * - Return GeoJson for counties.
 */
exports.geojson = function(req, res) {
    logger.filename(__filename);
    
    var geoJson = {
        type: 'FeatureCollection',
        features: []
    };

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'County GeoJson Error!',
            message: message || 'We had trouble retrieving geoJSON for the counties. Please try again.'
        });
    }
    
    if (!req.query.state) { return errorMessage(400, 'Please provide a state if you want to get the counties.'); }

    // get counties
    County.find({state: req.query.state})
        .exec(function(err, countyDocs) {
            if (err) { error.log(new Error(err)); return res.status(500).send(err); }

            // plug counties into geoJson
            countyDocs.forEach(function(county) {
                if (county.geometry) {
                    geoJson.features.push({
                        type: 'Feature',
                        properties: {
                            type: 'county',
                            _id: county._id,
                            name: county.name,
                            bounds: county.bounds
                        },
                        geometry: county.geometry
                    });
                }
            });

            // done
            return res.status(200).send(geoJson);
        });
};