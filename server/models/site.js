'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * Site Doc Schema
 * - The mongoose model 'Site' corresponds to the mongodb collection 'sites'.
 * - A 'Site' represents a single domain and it's associated information, settings, and counters.
 */
var SiteSchema = new Schema({

    //_id: {type: ObjectId} // automatically created for each document

    // the domain of a website (ex: prevagroup.com)
    domain: {
        type: String,
        required: true,
        unique: true
    },

    // the url of a website's home page (ex: http://www.prevagroup.com/)
    url: {
        type: String,
        required: true
    },

    // should the domain be crawled? (check blacklist)
    crawl: {
        type: String,
        enum: ['yes', 'no', 'maybe'],
        default: 'maybe'
    },

    // website category (ex: news, blog, research, advocacy, DOE)
    category: {
        type: String
    },

    // custom notes (ex: prevagroup is doing cool stuff with technology and education)
    notes: {
        type: String
    },

    // is crawler allowed to crawl? (should be false if disallow = '/')
    useRobots: {
        type: Boolean
    },

    // paths that crawler isn't allowed to crawl
    disallow: [{
        type: String
    }],

    // counter - number of pages fetched
    fetched: {
        type: Number,
        default: 0
    },

    // counter - number of pages ignored
    ignored: {
        type: Number,
        default: 0
    },

    // counter - number of pages that redirected
    redirected: {
        type: Number,
        default: 0
    },

    // counter - number of pages scheduled for crawling
    scheduled: {
        type: Number,
        default: 0
    },

    // counter - number of pages (from different domains) that point to this domain
    references: {
        type: Number,
        default: 0
    },

    // timestamp - when the site doc was created
    created: {
        type: Date,
        default: Date.now
    }
});

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

/**
 * Get domain from a url.
 * @param url - the url of a webpage
 * @returns {*} - return domain
 */
SiteSchema.statics.getDomain = function(url) {
    if (!url) {return;}
    var urlParts = url.split('://'),
        protocol = urlParts[0],
        slashIndex = urlParts[1].indexOf('/'),
        domain = (slashIndex > -1) ? urlParts[1].slice(0, slashIndex) : urlParts[1];
    while(domain.indexOf('.') !== domain.lastIndexOf('.')) {
        domain = domain.slice(domain.indexOf('.')+1);
    }
    return domain;
};

/**
 * Find an existing site or create a new site based on a url.
 *  - Used to get Site when creating a new page.
 * @param url - the url of a webpage
 * @param clbk - return clbk(err, siteDoc)
 */
SiteSchema.statics.findOrCreate = function(url, clbk) {
    var Site = this;
    if (!url) {return clbk(new Error('!url'));}

    // look for existing site
    Site.findOne({domain: Site.getDomain(url)}, function(err, siteDoc) {
        if (err) {return clbk(new Error(err));}
        if (siteDoc) {return clbk(null, siteDoc);}

        // create new site
        Site.create({url: url}, function(err, newSiteDoc) {
            if (err || !newSiteDoc) {return clbk(new Error(err || '!newSiteDoc'));}
            return clbk(null, newSiteDoc);
        });
    });
};

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

/**
 * Pre-validation hook to clean up url and set domain.
 */
SiteSchema.pre('validate', function(next) {
    if (this.url) {
        var urlParts = this.url.split('://'),
            protocol = urlParts[0],
            slashIndex = urlParts[1].indexOf('/'),
            domain = (slashIndex > -1) ? urlParts[1].slice(0, slashIndex) : urlParts[1];
        this.url = protocol+'://'+domain;
        while(domain.indexOf('.') !== domain.lastIndexOf('.')) {
            domain = domain.slice(domain.indexOf('.')+1);
        }
        this.domain = domain;
    }
    next();
});

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('Site', SiteSchema);
