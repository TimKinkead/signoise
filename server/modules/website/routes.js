'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var site = require('../website');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // CRUD operations for a site
    app.route('/data/site')
        .post(site.create);
        //.get(site.read)
        //.put(site.update)
        //.delete(site.delete);

    // list all sites
    //app.route('/data/site/list')
        //.get(site.list);

};
