'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var chalk = require('chalk');

//----------------------------------------------------------------------------------------------------------------------
// Methods

// log to console
exports.log = function(thing) {
    if (process.env.LOGGER === 'on') {
        console.log(thing);
    }
};

// log to console bold
exports.bold = function(thing) {
    if (process.env.LOGGER === 'on') {
        console.log(chalk.magenta.bold('\n***\n'+thing+'\n***\n'));
    }
};

// log filename
exports.filename = function(filename) {
    if (process.env.LOGGER === 'on') {
        var index = filename.lastIndexOf('\\')+1;
        filename = filename.slice(index);
        console.log(chalk.yellow.bold(filename));
    }
};

// log operation
exports.operation = function(operation) {
    if (process.env.LOGGER === 'on') {
        console.log(chalk.yellow(' - '+operation));
    }
};

// log result
exports.result = function(operation, result) {
    if (process.env.LOGGER === 'on') {
        if (!result) {
            result = operation;
            operation = null;
        }
        var str = (operation) ? operation : '';
        str += ' --> ';
        if (typeof result === 'string') {
            str += result;
            console.log(chalk.bold(str));
        } else {
            console.log(chalk.bold(str));
            console.log(result);
        }
    }
};

// log with dash
exports.dash = function(thing) {
    if (process.env.LOGGER === 'on') {
        if (typeof result === 'string') {
            console.log(chalk.bold('- '+thing));
        } else {
            console.log(chalk.bold('- '));
            console.log(thing);
        }
    }
};

// log with arrow
exports.arrow = function(thing) {
    if (process.env.LOGGER === 'on') {
        if (typeof thing === 'string') {
            console.log(chalk.bold(' --> '+thing));
        } else {
            console.log(chalk.bold(' --> '));
            console.log(thing);
        }
    }
};