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
exports.log = function(err) {
    if (!err || (err.constructor !== Error && typeof err !== 'object')) {return;}

    // construct error doc
    var errObj = new Err({
        name: err.name,
        message: (err.message) ? JSON.stringify(err.message) : err.message,
        stack: err.stack,
        info: (err.info) ? err.info : err.message
    });

    // save error doc
    errObj.save(function(err) {
        if (err) {
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