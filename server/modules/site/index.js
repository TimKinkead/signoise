'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash'),
    file = require('../file');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Bundle all js files in './controller' and return.
 * - This exports all public methods in this module as an object.
 * - Public methods are denoted by "exports.methodName = function() {...}"
 * - Usage:
 *   - If you set "var moduleName = require('server/modules/moduleName');" in another js file...
 *   - ... the require statement looks for an "index.js" file inside the "moduleName" directory (this file),...
 *   - ... which lets you use the public methods via "moduleName.publicMethodName()"
 *   - See './routes' as an example.
 */
module.exports = (function() {

    // parameters
    var controller = {},
        moduleName = module.filename.slice(module.filename.indexOf('modules')+8, module.filename.indexOf('index.js')-1),
        globPatterns = [
            'server/modules/'+moduleName+'/controller/*.js',
            'server/modules/'+moduleName+'/controller/**/*.js'
        ],
        rootPath = 'server/modules/'+moduleName;

    // glob files
    file.globber(globPatterns, rootPath)
        .forEach(function(routePath) {
            controller = _.extend(controller, require('.'+routePath));
        });

    // done
    return controller;
})();
