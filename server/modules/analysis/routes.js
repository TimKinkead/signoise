'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var analysis = require('../analysis');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // get/perform analysis
    app.route('/data/analysis')
        .get(analysis.go);

    // perform batch analysis
    // - run via cron job
    app.route('/data/analysis/batch')
        .get(analysis.batch);
    
};