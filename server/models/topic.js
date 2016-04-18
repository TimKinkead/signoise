'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//----------------------------------------------------------------------------------------------------------------------
// Schema

/**
 * Topic Doc Schema
 * - The mongoose model 'Topic' corresponds to the mongodb collection 'topics'.
 * - A 'Topic' doc represents a topic to be analyzed, essentiall a group of keywords.
 */
var TopicSchema = new Schema(
    {

        //_id: {type: ObjectId} // automatically created for each document

        // topic name
        name: {
            type: String,
            lowercase: true,
            required: true,
            unique: true
        },

        // keywords (or phrases)
        keywords: [{
            type: String,
            lowercase: true
        }],

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

/**
 * Virtual field for simple keyword string.
 */
TopicSchema.virtual('simpleKeywords').get(function() {
    var simpleKeywords = [];
    this.keywords.forEach(function(keyword) {
        var words = keyword.split(' ');
        words.forEach(function(word) {
            if (simpleKeywords.indexOf(word) < 0) {
                simpleKeywords.push(word);
            }
        });
    });
    simpleKeywords = simpleKeywords.join(' ');
    return simpleKeywords;
});

/**
 * Virtual field for keyword ngrams.
 */
TopicSchema.virtual('ngrams').get(function() {
    var ngrams = {};
    this.keywords.forEach(function(keyword) {
        var words = keyword.split(' ').length.toString();
        if (!ngrams[words]) { ngrams[words] = []; }
        if (keyword.charAt(0) === '#') { keyword = keyword.slice(1); }
        ngrams[words].push(keyword);
    });
    return ngrams;
});

//----------------------------------------------------------------------------------------------------------------------
// Instance Methods

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('Topic', TopicSchema);
