'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * SocialSeed Doc Schema
 * - The mongoose model 'SocialSeed' corresponds to the mongodb collection 'socialseeds'.
 * - A 'SocialSeed' doc represents a pertinent account/hashtag/term/etc that should be used to get social media from facebook, instagram, and twitter.
 */
var SocialSeedSchema = new Schema({

    //_id: {type: ObjectId} // automatically created for each document

    // the social media platform
    platform: {
        type: String,
        enum: ['facebook', 'instagram', 'twitter'],
        required: true
    },

    // twitter query
    // - https://dev.twitter.com/rest/public/search
    // - https://dev.twitter.com/rest/reference/get/search/tweets
    query: {
        type: String
    },

    // how often should social media be pulled from this seed?
    frequency: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'never']
    },

    // counter - how many social media docs reference this social seed doc
    references: {
        type: Number,
        default: 0
    },

    // how many posts/tweets have been pulled for this social seed
    media: {
        type: Number,
        default: 0
    },

    // timestamp - when frequency was set to anything except 'never'
    activated: {
        type: Date
    },

    // if/when historical tweets were pulled for this social seed
    initialized: {
        type: Date
    },

    // pull history
    history: [{
        date: {type: Date},
        total: {type: Number},
        new: {type: Number}
    }],

    // timestamp - when social media was last pulled for this seed
    /*lastPull: {
        type: Date
    },*/

    // timestamp - when the site doc was created
    created: {
        type: Date,
        default: Date.now
    }
});

//----------------------------------------------------------------------------------------------------------------------
// Virtual Fields

/**
 * Virtual field for last pull date.
 */
SocialSeedSchema.virtual('lastPullDate').get(function() {
    if (this.history && this.history[0] && this.history[0].date) {
        return this.history[0].date;
    }
    return null;
});

/**
 * Virtual field for total social media posts returned from last pull.
 */
SocialSeedSchema.virtual('lastPullTotal').get(function() {
    if (this.history && this.history[0] && this.history[0].total) {
        return this.history[0].total;
    }
    return 0;
});

/**
 * Virtual field for new social media posts returned from last pull.
 */
SocialSeedSchema.virtual('lastPullNew').get(function() {
    if (this.history && this.history[0] && this.history[0].new) {
        return this.history[0].new;
    }
    return 0;
});

//----------------------------------------------------------------------------------------------------------------------
// Instance Methods

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

/**
 * Pre-save hook to set activated.
 */
SocialSeedSchema.pre('save', function(next) {
    if (this.frequency && this.frequency !== 'never') {
        this.activated = new Date();
    }
    next();
});

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('SocialSeed', SocialSeedSchema);
