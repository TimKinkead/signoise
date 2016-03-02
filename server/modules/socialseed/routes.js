'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var socialseed = require('../socialseed');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // CRUD operation for social seeds
    app.route('/data/socialseed')
        .post(socialseed.create)
        .put(socialseed.update)
        .delete(socialseed.delete);

    // list social seeds
    app.route('/data/socialseed/list')
        .get(socialseed.list);

    // get social seed summary
    app.route('/data/socialseed/summary')
        .get(socialseed.summary);

};