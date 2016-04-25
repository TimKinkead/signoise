'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var channel = require('../channel');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // list channels
    app.route('/data/channel/list')
        .get(channel.list);

};