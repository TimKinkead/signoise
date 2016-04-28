'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * County Doc Schema
 * - The mongoose model 'County' corresponds to the mongodb collection 'counties'.
 * - A 'County' doc represents a county in a US state.
 */
var CountySchema = new Schema(
    {

        //_id: {type: ObjectId} // automatically created for each document

        // county name
        name: {
            type: String,
            lowercase: true,
            required: true
        },
        
        // state
        state: {
            type: Schema.ObjectId,
            ref: 'State',
            required: true
        },

        // county code from dataset
        code: {
            type: String
        },

        // county geo id from dataset
        geoId: {
            type: String
        },

        // geo json geometry
        geometry: {
            type: Object
        },

        // bounds [[sw lng, sw lat], [ne lng, ne lat]]
        bounds: {
            type: Schema.Types.Mixed
        },
        
        // timestamps
        modified: {
            type: Date
        },
        created: {
            type: Date,
            default: Date.now
        }
    },
    {
        // explicitly name mongodb collection to avoid 'countys'
        collection: 'counties'
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

mongoose.model('County', CountySchema);
