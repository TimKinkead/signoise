'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var init = require('../init');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // initialize topics
    app.route('/data/init/topics')
        .get(init.topics);

    // initialize districts
    app.route('/data/init/districts')
        .get(init.districts);

    // initialize states
    app.route('/data/init/states')
        .get(init.states);

    // initialize counties
    app.route('/data/init/counties')
        .get(init.counties);
};