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

        // optional type
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
        // explicitly name mongodb collection to avoid 'analysiss'
        collection: 'analysis'
    }
);

//----------------------------------------------------------------------------------------------------------------------
// Virtual Fields

//----------------------------------------------------------------------------------------------------------------------
// Instance Methods

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

/**
 * Pre-validation hook to set title & other fields.
 */
AnalysisSchema.pre('validate', function(next) {
    if (this.minDate && this.maxDate) {
        if (this.minDate.getMonth() === this.maxDate.getMonth() && 
            this.minDate.getFullYear() === this.maxDate.getFullYear()-1) {
            this.type = (this.maxDate.getMonth()+1)+'/1/'+this.maxDate.getFullYear()+' annual';
        }
    }
    next();
});

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('Analysis', AnalysisSchema);
