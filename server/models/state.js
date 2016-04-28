'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * State Doc Schema
 * - The mongoose model 'State' corresponds to the mongodb collection 'states'.
 * - A 'State' doc represents a US state.
 */
var StateSchema = new Schema(
    {

        //_id: {type: ObjectId} // automatically created for each document

        // state name
        name: {
            type: String,
            lowercase: true,
            required: true,
            unique: true
        },
        
        // state abbreviation
        abbv: {
            type: String,
            uppercase: true,
            required: true,
            unique: true
        },

        // state code from dataset
        code: {
            type: String
        },

        // state geo id from dataset
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

mongoose.model('State', StateSchema);
