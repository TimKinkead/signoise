'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var chalk = require('chalk');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
	Err = mongoose.model('Error');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/*
 * ERROR.LOG
 * - Log error to database (create error doc).
 */
exports.log = function(errObj) {
    if (!errObj || (errObj.constructor !== Error && typeof errObj !== 'object')) {return;}
    Err.create(errObj, function(err, newErrDoc) {
        if (err || !newErrDoc) {
            console.error(chalk.red('Error not saved!'));
            console.log(chalk.bold('> save error:'));
            console.log(err || '!newErrorDoc');
            console.log(chalk.bold('> original error:'));
            console.log(errObj);
        } else if (process.env.LOGGER === 'on') {
            console.error(chalk.red.bold('Error!'));
            console.log(errObj);
        }
    });
};