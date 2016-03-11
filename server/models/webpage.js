'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * WebPage Doc Schema
 * - The mongoose model 'WebPage' corresponds to the mongodb collection 'webpages'.
 * - A 'WebPage' represents a single web page at a specific url and it's associated information, status, and crawl results.
 */
var WebPageSchema = new Schema({

    // -- GENERAL --

    //_id: {type: ObjectId} // automatically created for each document

    // the domain of this web page (ex: prevagroup.com)
    domain: {
        type: String,
        required: true
    },

    // the sub-domain of this web page (ex: signal-noise.prevagroup.com)
    subdomain: {
        type: String,
        required: true
    },

    // the url of this web page (ex: http://www.prevagroup.com/about)
    url: {
        type: String,
        required: true,
        unique: true
    },

    // if this url points to social media
    // - (ex: a url pointing to a tweet should be pulled into the socialmedia collection and flagged as socialmedia here)
    socialmedia: {
        type: Boolean
    },

    // -- CRAWL INFO --

    // the crawl status of this web page
    status: {
        type: String,
        enum: [
            'pending',      // WebPage is waiting for a decision to crawl domain (site.crawl='maybe')
            'fetched',      // WebPage has been crawled
            'ignored',      // WebPage was ignored (site.crawl='no' or url is on blacklist)
            'redirected',   // WebPage redirected to somewhere else
            'scheduled'     // WebPage is ready to be crawled
        ],
        default: 'pending'
    },

    // the date this web page was crawled
    crawlDate: {
        type: Date
    },

    // the type of information returned when crawling this web page (ex: 'text/html')
    type: {
        type: String
    },

    // the web page title
    title: {
        type: String
    },

    // the content retrieved from this web page
    content: {
        type: String
    },

    // links to other web pages at the same domain
    internalLinks: [{
        type: Schema.ObjectId,
        ref: 'WebPage'
    }],

    // links to other web pages at different domains
    externalLinks: [{
        type: Schema.ObjectId,
        ref: 'WebPage'
    }],

    // other metadata from content analysis
    meta: {
        type: Object
    },

    // -- COUNTERS --

    // how many web pages at the same domain link to this web page
    internalReferences: {
        type: Number,
        default: 0
    },

    // how many web pages at different domains link to this web page
    externalReferences: {
        type: Number,
        default: 0
    },

    // how many social media docs link to this web page
    socialReferences: {
        type: Number,
        default: 0
    },

    // -- TIMESTAMP --

    // when this web page doc was created
    created: {
        type: Date,
        default: Date.now
    }
});

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

/**
 * Pre-validation hook to set domain/subdomain.
 */
WebPageSchema.pre('validate', function(next) {
    if (this.url && this.url.indexOf('://') > -1) {
        var urlParts = this.url.split('://'),
            slashIndex = urlParts[1].indexOf('/'),
            subdomain = (slashIndex > -1) ? urlParts[1].slice(0, slashIndex) : urlParts[1],
            domain = subdomain;
        while(domain.indexOf('.') !== domain.lastIndexOf('.')) {
            domain = domain.slice(domain.indexOf('.')+1);
        }
        this.domain = domain;
        this.subdomain = subdomain;
    }
    next();
});

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('WebPage', WebPageSchema);
