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

    // perform analysis for all counties for past year
    // - run via cron job
    app.route('/data/analysis/all-counties-annual')
        .get(analysis.allCountiesAnnual);
    
};