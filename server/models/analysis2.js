'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * Analysis Doc Schema
 * - The mongoose model 'Analysis2' corresponds to the mongodb collection 'analysis2'.
 */
var Analysis2Schema = new Schema(
    {

        //_id: {type: ObjectId} // automatically created for each document

        // type
        type: {
            type: String
        },

        // start analysis date
        minDate: {
            type: Date,
            required: true
        },

        // end analysis date
        maxDate: {
            type: Date,
            required: true
        },

        // channel
        channel: {
            type: String,
            required: true
        },

        // topic
        topic: {
            type: Schema.ObjectId,
            ref: 'Topic'
        },

        // state
        state: {
            type: Schema.ObjectId,
            ref: 'State'
        },

        // county
        county: {
            type: Schema.ObjectId,
            ref: 'County'
        },

        // district
        district: {
            type: Schema.ObjectId,
            ref: 'District'
        },

        // social seed
        socialseed: {
            type: Schema.ObjectId,
            ref: 'SocialSeed'
        },
        
        // twitter account
        twitterAccount: {
            type: String
        },
        
        // network type
        networkType: {
            type: String,
            enum: ['district', 'related', 'geographic']
        },

        // network weight
        networkWeight: {
            type: Number
        },

        // rank weight
        rankWeight: {
            type: Number
        },
        
        // number of topic related social media
        count: {
            type: Number
        },

        // total number of social media
        totalCount: {
            type: Number
        },

        // avg sentiment
        sentiment: {
            type: Number
        },

        // timestamp
        created: {
            type: Date,
            default: Date.now
        }
    },
    {
        // explicitly name mongodb collection to avoid 'analysiss'
        collection: 'analysis2'
    }
);

//----------------------------------------------------------------------------------------------------------------------
// Virtual Fields

Analysis2Schema.virtual('frequency').get(function() {
    return this.count/this.totalCount;
});

Analysis2Schema.virtual('weightedFrequency').get(function() {
    return (this.count/this.totalCount)*(this.networkWeight+this.rankWeight);
});

Analysis2Schema.virtual('weightedCount').get(function() {
    return this.count*(this.networkWeight+this.rankWeight);
});

Analysis2Schema.virtual('weightedSentiment').get(function() {
    return this.sentiment*(this.networkWeight+this.rankWeight);
});

//----------------------------------------------------------------------------------------------------------------------
// Instance Methods

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('Analysis2', Analysis2Schema);
