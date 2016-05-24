'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * WEBNETWORK.GET
 * - Get web network data for a specific channel.
 */
exports.get = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Web Network Error!',
            message: message || 'We had trouble retrieving the web network data. Please try again.'
        });
    }

    switch(req.query.channel) {
        case 'all':     return res.status(200).send(require('../data/all'));
        case 'core':    return res.status(200).send(require('../data/core'));
        case 'coupled': return res.status(200).send(require('../data/coupled'));
        default:        errorMessage();
    }
    
};