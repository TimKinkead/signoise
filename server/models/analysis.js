'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * Analysis Doc Schema
 * - The mongoose model 'Analysis' corresponds to the mongodb collection 'analysis'.
 * - A 'Analysis' doc represents the analysis for a specific topic/date/channel/state/county.
 */
var AnalysisSchema = new Schema(
    {

        //_id: {type: ObjectId} // automatically created for each document

        // analysis name
        topic: {
            type: Schema.ObjectId,
            ref: 'Topic',
            required: true
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
            enum: [],
            required: true
        },

        // state
        state: {
            type: String
        },

        // county
        county: {
            type: String
        },
        
        // number of docs analyzed
        count: {
            type: Number
        },

        // sentiment
        sentiment: {
            type: Object
        },

        // ngrams
        ngrams: {
            type: Object
        },

        // timestamp
        created: {
            type: Date,
            default: Date.now
        }
    },
    {
        collection: 'analysis'
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

mongoose.model('Analysis', AnalysisSchema);