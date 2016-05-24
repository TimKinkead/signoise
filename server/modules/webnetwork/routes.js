'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var webnetwork = require('../webnetwork');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // get web network data
    app.route('/data/webnetwork')
        .get(webnetwork.get);

};