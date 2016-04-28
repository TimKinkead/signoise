'use strict';

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
 * STATE.GEOJSON
 * - Return GeoJson for states.
 */
exports.geojson = function(req, res) {
    logger.filename(__filename);

    var geoJson = {
        type: 'FeatureCollection',
        features: []
    };

    // get states
    State.find({name: 'california'})
        .exec(function(err, stateDocs) {
            if (err) { error.log(new Error(err)); return res.status(500).send(err); }

            // plug states into geoJson
            stateDocs.forEach(function(state) {
                if (state.geometry) {
                    geoJson.features.push({
                        type: 'Feature',
                        properties: {
                            type: 'state',
                            _id: state._id,
                            name: state.name,
                            bounds: state.bounds
                        },
                        geometry: state.geometry
                    });
                }
            });

            // done
            return res.status(200).send(geoJson);
        });
};