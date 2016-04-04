'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * Summary Doc Schema
 * - The mongoose model 'Summary' corresponds to the mongodb collection 'summary'.
 * - A 'Summary' doc represents a snapshot of the database or some process.
 */
var SummarySchema = new Schema(
    {
        type: {
            type: String
        },
        data: {
            type: Object
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        collection: 'summary'
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

mongoose.model('Summary', SummarySchema);
