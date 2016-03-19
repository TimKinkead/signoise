'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var socialmedia = require('../socialmedia');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // read social media
    app.route('/data/socialmedia')
        .get(socialmedia.read);
    
    // list social media
    app.route('/data/socialmedia/list')
        .get(socialmedia.list);

    // get social media summary
    app.route('/data/socialmedia/summary')
        .get(socialmedia.summary);

    // pull social media and save to mongodb
    // - this is called every ?? minutes by a cron job
    app.route('/data/socialmedia/pull/twitter').get(socialmedia.pullTwitter);
    app.route('/data/socialmedia/pull/facebook').get(socialmedia.pullFacebook);
    //app.route('/data/socialmedia/pull/instagram').get(socialmedia.pullInstagram);

    // download social media as csv file
    app.route('/data/socialmedia/download')
        .get(socialmedia.download);

};