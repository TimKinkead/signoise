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
        .get(socialseed.read)
        .put(socialseed.update)
        .delete(socialseed.delete);

    // list social seeds
    app.route('/data/socialseed/list')
        .get(socialseed.list);

    // get social seed summary
    app.route('/data/socialseed/summary')
        .get(socialseed.summary);

    // get facebook search results (groups and pages)
    app.route('/data/socialseed/facebook/search')
        .get(socialseed.searchFacebook);

    // update twitter user data for social seeds
    app.route('/data/socialseed/update/twitter-data')
        .get(socialseed.updateTwitterData);

    // update twitter user data for social seeds
    app.route('/data/socialseed/update/categories')
        .get(socialseed.updateCategories);

    // update state/county/district for social seeds
    app.route('/data/socialseed/update/geo')
        .get(socialseed.updateGeo);
    
    // calculate network weights
    app.route('/data/socialseed/calculate/weights')
        .get(socialseed.calculateWeights);
};