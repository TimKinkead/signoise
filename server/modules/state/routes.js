'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var state = require('../state');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // list states
    app.route('/data/state/list')
        .get(state.list);

    // get geojson for states
    app.route('/data/state/list/geojson')
        .get(state.geojson);

};