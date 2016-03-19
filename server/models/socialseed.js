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

    // title
    title: {
        type: String
        //required: true
    },

    // the social media platform
    platform: {
        type: String,
        enum: ['facebook', 'instagram', 'twitter'],
        required: true
    },

    // twitter query // TODO - remove!!
    // - https://dev.twitter.com/rest/public/search
    // - https://dev.twitter.com/rest/reference/get/search/tweets
    query: {
        type: String
    },

    // twitter
    twitter: {
        query: {type: String},
        hashtag: {type: Boolean},
        username: {type: Boolean}
    },

    // facebook
    facebook: {
        id: {type: String},
        name: {type: String},
        type: {type: String, enum: ['group', 'page']},
        category: {type: String}
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

    // if/when historical tweets were pulled for this social seed
    initialized: {
        type: Date
    },

    // pull history
    history: [{
        _id: false,
        date: {type: Date},
        total: {type: Number},
        new: {type: Number}
    }],

    // timestamp - when social media was last pulled for this seed
    lastPulled: {
        type: Date
    },

    // timestamp - when the site doc was created
    created: {
        type: Date,
        default: Date.now
    }
});

//----------------------------------------------------------------------------------------------------------------------
// Virtual Fields

//----------------------------------------------------------------------------------------------------------------------
// Instance Methods

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

/**
 * Pre-validation hook to set title & other fields.
 */
SocialSeedSchema.pre('validate', function(next) {
    if (!this.title) {
        switch(this.platform) {
            case 'facebook':
                if (this.facebook && this.facebook.name) {
                    this.title = this.facebook.name;
                }
                break;
            case 'twitter':
                if (this.twitter && this.twitter.query) {
                    this.title = this.twitter.query;
                    if (this.twitter.query.indexOf('#') === 0 && this.twitter.query.indexOf(' ') < 0) {
                        this.twitter.hashtag = true;
                    }
                    if (this.twitter.query.indexOf('@') === 0 && this.twitter.query.indexOf(' ') < 0) {
                        this.twitter.username = true;
                    }
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

mongoose.model('SocialSeed', SocialSeedSchema);
