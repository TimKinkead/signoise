'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var socialmedia = {};
socialmedia = _.extend(socialmedia, require('../modules/socialmedia/controller/twitter/socialmedia.twitter.clean.text.js'));
socialmedia = _.extend(socialmedia, require('../modules/socialmedia/controller/facebook/socialmedia.facebook.clean.text.js'));

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * SocialMedia Doc Schema
 * - The mongoose model 'SocialMedia' corresponds to the mongodb collection 'socialmedia'.
 * - A 'SocialMedia' doc represents a facebook post, instagram post, or tweet.
 */
var SocialMediaSchema = new Schema(
    {

        //_id: {type: ObjectId} // automatically created for each document

        // post or tweet date
        // - pulled from 'data' via pre-validation hook
        date: {
            type: Date,
            required: true
        },
        
        // facebook post 'message' or tweet 'text'
        // - pulled from 'data' via pre-validation hook
        text: {
            type: String
            // not required b/c not all fb posts have a message
        },
        
        // longitude, latitude for geoWithin queries
        // - pulled from 'data' via pre-validation hook
        location: [{
            type: Number
        }],

        // geo data
        // - from social seed
        district: {
            type: Schema.ObjectId,
            ref: 'District'
        },
        county: {
            type: Schema.ObjectId,
            ref: 'County'
        },
        state: {
            type: Schema.ObjectId,
            ref: 'State'
        },
        
        // the social seed used to pull this social media
        // - necessary for connecting fb posts to fb groups/pages
        // - not very important for twitter
        socialseed: {
            type: Schema.ObjectId,
            ref: 'SocialSeed'
            // not required b/c tweets extracted from webpages don't have seed
        },

        // the social media platform
        platform: {
            type: String,
            enum: ['facebook', 'instagram', 'twitter'],
            required: true
        },

        // json data - the raw post or tweet
        data: {
            type: Object,
            required: true
        },

        // ngrams - results from ngram processing
        ngrams: {
            '1': {
                gramSize: {type: Number},
                gramCount: {type: Number},
                wordCount: {type: Number},
                sorted: [{
                    _id: false,
                    word: {type: String},
                    count: {type: Number}
                }]
            },
            '2': {
                gramSize: {type: Number},
                gramCount: {type: Number},
                wordCount: {type: Number},
                sorted: [{
                    _id: false,
                    word: {type: String},
                    count: {type: Number}
                }]
            },
            '3': {
                gramSize: {type: Number},
                gramCount: {type: Number},
                wordCount: {type: Number},
                sorted: [{
                    _id: false,
                    word: {type: String},
                    count: {type: Number}
                }]
            },
            '4': {
                gramSize: {type: Number},
                gramCount: {type: Number},
                wordCount: {type: Number},
                sorted: [{
                    _id: false,
                    word: {type: String},
                    count: {type: Number}
                }]
            },
            all: [{
                word: {type: String},
                count: {type: Number},
                gramSize: {type: Number},
                gramCount: {type: Number},
                wordCount: {type: Number}
            }]
        },

        // sentiment - result from sentiment processing
        sentiment: {
            type: Number
        },

        // timestamp - when the ngram processing was performed
        ngramsProcessed: {
            type: Date
        },

        // timestamp - when the sentiment processing was performed
        sentimentProcessed: {
            type: Date
        },
        
        // timestamp - when the location was checked
        locationChecked: {
            type: Date  
        },

        // timestamp - when state/county/district fields were last updated
        geoUpdated: {
            type: Date
        },

        // timestamp - when data field was updated by a later 'pull'
        modified: {
            type: Date
        },

        // timestamp - when the site doc was created
        created: {
            type: Date,
            default: Date.now
        }
    },
    {
        // explicitly name mongodb collection to avoid 'socialmedias'
        collection: 'socialmedia'
    }
);

//----------------------------------------------------------------------------------------------------------------------
// Virtual Fields

//----------------------------------------------------------------------------------------------------------------------
// Instance Methods

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

/**
 * Pre-validation hook grab text & date.
 */
SocialMediaSchema.pre('validate', function(next) {
    if (this.data) {
        switch(this.platform) {
            case 'facebook':
                if (this.data.message) {this.text = socialmedia.cleanFacebookText(this.data.message);}
                if (this.data.created_time) {this.date = new Date(this.data.created_time);}
                break;
            case 'twitter':
                if (this.data.created_at) {this.date = new Date(this.data.created_at);}
                if (this.data.text) {this.text = socialmedia.cleanTwitterText(this.data.text);}
                if (this.data.coordinates && this.data.coordinates.coordinates) {
                    this.location = this.data.coordinates.coordinates;
                    this.locationChecked = new Date();
                }
                break;
        }
    }
    next();
});

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('SocialMedia', SocialMediaSchema);
