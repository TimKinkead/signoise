'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var webpage = require('../webpage');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // list web pages
    app.route('/data/webpage/list')
        .get(webpage.list);

    // get web pages summary
    app.route('/data/webpage/summary')
        .get(webpage.summary);
    
    // download web pages as csv file
    //app.route('/data/webpage/download')
    //    .get(webpage.download);

    // extract tweets from web page status urls
    app.route('/data/webpage/extract/twitter')
        .get(webpage.extractTweets);

};