'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    Topic = mongoose.model('Topic');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Data

var topics = require('../data/topics');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * INIT.TOPICS
 * - Initialize topics collection by upserting into database.
 */
exports.topics = function(req, res) {
    logger.filename(__filename);
    
    var errs = [],
        cnt = topics.length;
    
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            if (errs.length) { return res.status(500).send(errs); }
            return res.status(200).send('Topics initialized.');
        }
    }
    
    // create topics
    topics.forEach(function(topic) {
        Topic.update(
            {name: topic.name},
            {
                $set: {
                    keywords: topic.keywords,
                    modified: new Date()
                },
                $setOnInsert: {
                    created: new Date()
                }
            },
            {upsert: true},
            function(err) {
                if (err) { error.log(new Error(err)); errs.push(err); }
                checkDone();
            }
        );
    });
};