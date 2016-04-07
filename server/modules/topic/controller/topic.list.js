'use strict';


//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Topic.LIST
 * - List topics.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    return res.status(200).send([
        {
            name: 'common core',
            terms: ['common core', 'ccss']
        }
    ]);
};