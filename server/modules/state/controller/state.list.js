'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    State = mongoose.model('State');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * STATE.LIST
 * - List states.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'List States Error!',
            message: message || 'We had trouble listing the states. Please try again.'
        });
    }

    if (!req.user || !req.user._id) { return errorMessage(403, 'Please login or sign up if you want to list the states.'); }

    // get states
    State.find({name: 'california'})
        .select('name abbv bounds')
        .exec(function(err, stateDocs) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!stateDocs) { error.log(new Error('!stateDocs')); return errorMessage(); }

            // done
            logger.result('states listed');
            return res.status(200).send(stateDocs);
        });
};