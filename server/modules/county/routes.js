'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var county = require('../county');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // list counties
    app.route('/data/county/list')
        .get(county.list);

    // get geojson for counties
    app.route('/data/county/list/geojson')
        .get(county.geojson);
    
};