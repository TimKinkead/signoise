'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var core = require('../core');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // render index.html (angular application skeleton)
	app.route('/').get(core.index);

    // return 200 for load balancer health check
    app.route('/data/ping').get(core.ping);

    // get environment variables
    app.route('/data/env-var').get(core.envVar);

    // kill the application
    app.route('/data/stop').get(core.stop);

    // render unsupported.html for old browsers
    app.route('/unsupported').get(core.unsupported);

};
