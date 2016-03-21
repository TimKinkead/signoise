'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

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
            type: Date
            //required: true
        },
        
        // facebook post 'message' or tweet 'text'
        // - pulled from 'data' via pre-validation hook
        text: {
            type: String
            //required: true
        },

        // the social seed used to pull this social media
        // - necessary for connecting fb posts to fb groups/pages
        // - not very important for twitter
        socialseed: {
            type: Schema.ObjectId,
            ref: 'SocialSeed'
            //required: true
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

        // status of analysis
        status: {
            type: String,
            enum: [
                'ready',    // ready for analysis
                'failed',   // analysis failed
                'complete'  // analysis is complete
            ],
            default: 'ready'
        },

        // metadata from analysis
        meta: {
            type: Object
        },

        // timestamp - when the analysis was performed
        processed: {
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
        // mongodb collection name
        // - explicitly define here to avoid mongoose default to 'socialmedias'
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
                if (this.data.message) {this.text = this.data.message;}
                if (this.data.created_time) {this.date = new Date(this.data.created_time);}
                break;
            case 'twitter':
                if (this.data.text) {this.text = this.data.text;}
                if (this.data.created_at) {this.date = new Date(this.data.created_at);}
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
