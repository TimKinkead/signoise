'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * WebSite Doc Schema
 * - The mongoose model 'WebSite' corresponds to the mongodb collection 'websites'.
 * - A 'WebSite' represents a single domain and it's associated information, settings, and counters.
 */
var WebSiteSchema = new Schema({

    // -- GENERAL --

    //_id: {type: ObjectId} // automatically created for each document

    // the root domain of this website (ex: prevagroup.com)
    domain: {
        type: String,
        required: true
        // not unique - could have multiple subdomains
    },

    // the unique sub-domain of this website (ex: signal-noise.prevagroup.com)
    subdomain: {
        type: String,
        required: true,
        unique: true
    },

    // the url of this website's home page (ex: http://www.prevagroup.com/)
    url: {
        type: String,
        required: true
    },

    // -- CRAWL INFO --

    // should this website be crawled?
    crawl: {
        type: String,
        enum: ['yes', 'no']
    },

    // is crawler allowed to crawl? (should be false if disallow = '/')
    useRobots: {
        type: Boolean
    },

    // paths that crawler isn't allowed to crawl
    disallow: [{
        type: String
    }],

    // -- CUSTOM FIELDS --

    // website category (ex: news, blog, research, advocacy, DOE)
    category: {
        type: String
    },

    // custom notes (ex: prevagroup is doing cool stuff with technology and education)
    notes: {
        type: String
    },

    // -- COUNTERS --

    // number of web pages fetched
    fetched: {
        type: Number,
        default: 0
    },

    // number of web pages ignored
    ignored: {
        type: Number,
        default: 0
    },

    // number of web pages that redirected
    redirected: {
        type: Number,
        default: 0
    },

    // number of web pages scheduled for crawling
    scheduled: {
        type: Number,
        default: 0
    },

    // number of web pages at different domains that link to a web page at this domain
    externalReferences: {
        type: Number,
        default: 0
    },

    // number of social media docs that link to a web page at this domain
    socialReferences: {
        type: Number,
        default: 0
    },

    // -- TIMESTAMP --

    // when the website doc was created
    created: {
        type: Date,
        default: Date.now
    }
});

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

WebSiteSchema.statics.getUrlData = function(url) {
    var urlData = {};
    if (url && url.indexOf('://') > -1) {
        var urlParts = url.split('://'),
            protocol = urlParts[0],
            slashIndex = urlParts[1].indexOf('/'),
            subdomain = (slashIndex > -1) ? urlParts[1].slice(0, slashIndex) : urlParts[1],
            domain = subdomain;
        while(domain.indexOf('.') !== domain.lastIndexOf('.')) {
            domain = domain.slice(domain.indexOf('.')+1);
        }
        urlData.domain = domain;
        urlData.subdomain = subdomain;
        urlData.url = protocol+'://'+subdomain;
    }
    return urlData;
};

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

/**
 * Pre-validation hook to clean up url and set domain/subdomain.
 */
WebSiteSchema.pre('validate', function(next) {
    if (this.url) {
        var urlData = WebSiteSchema.statics.getUrlData(this.url);
        this.domain = urlData.domain;
        this.subdomain = urlData.subdomain;
        this.url = urlData.url;
    }
    /*
    if (this.url && this.url.indexOf('://') > -1) {
        var urlParts = this.url.split('://'),
            protocol = urlParts[0],
            slashIndex = urlParts[1].indexOf('/'),
            subdomain = (slashIndex > -1) ? urlParts[1].slice(0, slashIndex) : urlParts[1],
            domain = subdomain;
        while(domain.indexOf('.') !== domain.lastIndexOf('.')) {
            domain = domain.slice(domain.indexOf('.')+1);
        }
        this.domain = domain;
        this.subdomain = subdomain;
        this.url = protocol+'://'+subdomain;
    }*/
    next();
});

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('WebSite', WebSiteSchema);
