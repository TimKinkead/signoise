'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    District = mongoose.model('District');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * DISTRICT.LIST.GEOJSON
 * - Return GeoJson for districts.
 */
exports.geojson = function(req, res) {
    logger.filename(__filename);
    
    var geoJson = {
        type: 'FeatureCollection',
        features: []
    };

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'District GeoJson Error!',
            message: message || 'We had trouble retrieving geoJSON for the districts. Please try again.'
        });
    }
    
    if (!req.query.state || !req.query.county) { return errorMessage(400, 'Please provide a state if you want to get the districts.'); }

    // get districts
    District.find({state: req.query.state, county: req.query.county})
        .exec(function(err, districtDocs) {
            if (err) { error.log(new Error(err)); return res.status(500).send(err); }

            // plug districts into geoJson
            districtDocs.forEach(function(district) {
                if (district.location) {
                    geoJson.features.push({
                        type: 'Feature',
                        properties: {
                            type: 'district',
                            _id: district._id,
                            name: district.name
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: district.location
                        }
                    });
                }
            });

            // done
            return res.status(200).send(geoJson);
        });
};