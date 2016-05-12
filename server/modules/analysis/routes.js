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

    // get/perform analysis
    app.route('/data/analysis2')
        .get(analysis.analysis2);

    // download analysis
    app.route('/data/analysis2/download')
        .get(analysis.analysis2download);
};