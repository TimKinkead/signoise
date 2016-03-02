'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * Page Doc Schema
 * - The mongoose model 'Page' corresponds to the mongodb collection 'pages'.
 * - A 'Page' represents a single webpage and it's associated information, status, and crawl results.
 */
var PageSchema = new Schema({

    //_id: {type: ObjectId} // automatically created for each document

    // the url of a webpage (ex: http://www.prevagroup.com/about)
    url: {
        type: String,
        required: true,
        unique: true
    },

    // a pointer to the associated Site Doc (site._id)
    site: {
        type: Schema.ObjectId,
        ref: 'Site',
        required: true
    },

    // the crawl status of this webpage (check site.crawl and blacklist)
    status: {
        type: String,
        enum: [
            'pending',      // webpage is waiting for a decision to crawl domain (site.crawl='maybe')
            'fetched',      // webpage has been crawled
            'ignored',      // webpage was ignored (site.crawl='no' or url is on blacklist)
            'redirected',   // webpage redirected to somewhere else
            'scheduled'     // webpage is ready to be crawled
        ],
        required: true
    },

    // -- CRAWL RESULTS -- >>>

    // the type of information returned when crawling this webpage (ex: 'text/html')
    type: {
        type: String
    },

    // the date this webpage was crawled
    crawlDate: {
        type: Date
    },

    // the webpage title
    title: {
        type: String
    },

    // the content retrieved from this webpage - TODO: decide if we want to store content here
    content: {
        type: String
    },

    // links to other webpages (at different domains)
    links: [{
        type: Schema.ObjectId,
        ref: 'Page'
    }],

    // other metadata from content analysis
    meta: {
        type: Object
    },

    // <<< -- CRAWL RESULTS --

    // other webpages that link to this page (from different domains)
    references: [{
        type: Schema.ObjectId,
        ref: 'Page'
    }],

    // timestamp - when the page doc was created
    created: {
        type: Date,
        default: Date.now
    }
});

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('Page', PageSchema);
