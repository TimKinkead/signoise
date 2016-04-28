'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var district = require('../district');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // CRUD operation for districts
    app.route('/data/district')
        .post(district.create)
        .get(district.read)
        .put(district.update)
        .delete(district.delete);

    // list districts
    app.route('/data/district/list')
        .get(district.list);

    // get geojson for districts
    app.route('/data/district/list/geojson')
        .get(district.geojson);

    // get district summary
    app.route('/data/district/summary')
        .get(district.summary);

};