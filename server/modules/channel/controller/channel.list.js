'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * CHANNEL.LIST
 * - List channels.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    return res.status(200).send(require('../data/channels.js'));
};