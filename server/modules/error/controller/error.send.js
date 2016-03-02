'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logError = require('./error.log.js').log;

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * ERROR.SEND
 * - Log error to database & send response.
 * - Called internally.
 */
exports.send = function(errObj, res) {
	logError(errObj);
	return res.status(500).send({
		header: errObj.name || 'Error!',
		message: errObj.message || 'Something went wrong.'
	});
};
