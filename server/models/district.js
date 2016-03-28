'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * District Doc Schema
 * - The mongoose model 'District' corresponds to the mongodb collection 'districts'.
 * - A 'District' doc represents a school district.
 */
var DistrictSchema = new Schema(
    {

        //_id: {type: ObjectId} // automatically created for each document

        // district name
        name: {
            type: String,
            required: true
            // not unique - some districts have same name
        },

        // CDS Code (Common Data Set Initiative) http://www.commondataset.org/
        cdsId: {
            type: Number,
            required: true,
            unique: true
        },

        // NCES LEA Number (National Center for Education Statistics - Local Education Authority) https://nces.ed.gov/
        ncesId: {
            type: Number,
            required: true,
            unique: true
        },

        // district website
        website: {
            type: Schema.ObjectId,
            ref: 'WebSite'
        },

        // district facebook account
        facebookSeed: {
            type: Schema.ObjectId,
            ref: 'SocialSeed'
        },
        facebookAccount: { // temp field for searching for seed
            type: String
        },

        // district twitter account
        twitterSeed: {
            type: Schema.ObjectId,
            ref: 'SocialSeed'
        },

        // location
        street: {
            type: String
        },
        city: {
            type: String,
            lowercase: true
        },
        state: {
            type: String,
            lowercase: true
        },
        zip: {
            type: String
        },
        county: {
            type: String,
            lowercase: true
        },
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        },

        // counters
        studentCount: {type: Number},
        lepCount: {type: Number},
        iepCount: {type: Number},
        frlCount: {type: Number},
        fetchCount: {type: Number},
        
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

mongoose.model('District', DistrictSchema);
