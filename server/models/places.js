'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * Place Doc Schema
 * - The mongoose model 'Place' corresponds to the mongodb collection 'places'.
 * - A 'Place' doc represents a state, city, or any location returned from the Twitter API Geo Search.
 * - https://dev.twitter.com/rest/reference/get/geo/search
 * - Places are used to determine lat/lng for social media based on a user's profile location.
 */
var PlaceSchema = new Schema(
    {

        //_id: {type: ObjectId} // automatically created for each document

        // place names (variations from social media)
        names: [{
            type: String,
            lowercase: true,
            required: true
        }],

        // [longitude, latitude]
        location: [{
            type: Number
        }],

        // data source (twitter, google, etc)
        source: {
            type: String,
            enum: ['twitter']
        },
        
        // raw place data
        data: {
            type: Object
        },

        // timestamps
        modified: {
            type: Date
        },
        created: {
            type: Date,
            default: Date.now
        }
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

mongoose.model('Place', PlaceSchema);
