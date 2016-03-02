'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var socialmedia = require('../socialmedia');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // list social media
    app.route('/data/socialmedia/list')
        .get(socialmedia.list);

    // get social media summary
    app.route('/data/socialmedia/summary')
        .get(socialmedia.summary);

    // preview social media for social seed
    app.route('/data/socialmedia/preview/twitter').get(socialmedia.previewTwitter);
    //app.route('/data/socialmedia/preview/facebook').get(socialmedia.previewFacebook);
    //app.route('/data/socialmedia/preview/instagram').get(socialmedia.previewInstagram);

    // pull social media and save to mongodb
    // - this is called every ?? minutes by a cron job
    app.route('/data/socialmedia/pull/twitter').get(socialmedia.pullTwitter);
    //app.route('/data/socialmedia/pull/facebook').get(socialmedia.pullFacebook);
    //app.route('/data/socialmedia/pull/instagram').get(socialmedia.pullInstagram);

};