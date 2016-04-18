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
// Main

/**
 * Topic.LIST
 * - List topics.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'List Topics Error!',
            message: message || 'We had trouble listing the topics. Please try again.'
        });
    }

    // get topics
    Topic.find({}, function(err, topicDocs) {
        if (err) { error.log(new Error(err)); return errorMessage(); }
        if (!topicDocs) { error.log(new Error('!topicDocs')); return errorMessage(); }

        return res.status(200).send(topicDocs);
    });
};