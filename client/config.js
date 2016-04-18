//This file is used by the server in development to populate jsFiles in index.html
//and by grunt during the build process to create complied & minified js files.

'use strict';

var _file = require('../server/modules/file');

module.exports = (function() {

    var libFiles = [
        'lib/angular/angular.min.js',
        'lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'lib/angular-resource/angular-resource.min.js',
        'lib/angular-ui-router/release/angular-ui-router.min.js',
        'lib/angular-sanitize/angular-sanitize.min.js',
        'lib/angularjs-slider/dist/rzslider.min.js'
    ];

    var appRoot = 'client/',
        appFiles = _file.globber(
            [
                appRoot + 'modules/core/app.js',
                appRoot + 'modules/core/routes.js',
                appRoot + 'modules/core/**/*.js',
                appRoot + 'modules/parts/**/*.js',
                appRoot + 'modules/main/**/*.js'
            ],
            appRoot
        );

    return {
        // used by grunt task
        libFiles: libFiles,
        appFiles: appFiles,

        // used by server when rendering index.html in development
        jsFiles: libFiles.concat(appFiles)
    };

})();