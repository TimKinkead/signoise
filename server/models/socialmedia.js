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

        // the social media platform
        platform: {
            type: String,
            enum: ['facebook', 'instagram', 'twitter'],
            required: true
        },

        // json data returned by platform
        // - this is the raw post or tweet
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

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('SocialMedia', SocialMediaSchema);
