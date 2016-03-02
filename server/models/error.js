'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Variables

var pkg = require('../../package.json');

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * Error Doc Schema
 * - The mongoose model 'Error' corresponds to the mongodb collection 'errors'.
 * - An 'Error' represents an error that was captured in the application.
 * - See the Node.js docs for more info: https://nodejs.org/api/errors.html#errors_class_error
 */
var ErrorSchema = new Schema({

    //_id: {type: ObjectId} // automatically created for each document

    // error name (ex: 'Error')
    name: {type: String},

    // error message (ex: 'the expected thing didn't happen')
    message: {type: String},

    // the stack trace
    stack: {type: String},

    // the application version when the error happened
    release: {
        type: String,
        default: pkg.version
    },

    // timestamp - when the error doc was created
    created: {
        type: Date,
        default: Date.now
    }
});

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('Error', ErrorSchema);
