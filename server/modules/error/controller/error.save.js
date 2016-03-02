'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logError = require('./error.log.js').log,
    priorityError = require('./error.priority.js').priority;

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * ERROR.SAVE
 * - Log error to database & return success.
 * - Called externally. (POST /data/error)
 */
exports.save = function(req, res) {
    var errObj = {};
    errObj.name = req.body.name;
    errObj.message = req.body.message;
    errObj.stack = req.body.stack;
    errObj.type = 'client';
    errObj.info = {};
    for (var key in req.body) {
        if (req.body.hasOwnProperty(key)) {
            if (key !== 'name' && key !== 'message' && key !== 'stack') {
                errObj.info[key] = req.body[key];
            }
        }
    }
    if (errObj.priority) {priorityError(errObj);}
    else {logError(errObj);}
    return res.sendStatus(200);
};
