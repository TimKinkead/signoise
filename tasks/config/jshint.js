'use strict';

// check js syntax (see '.jshintrc' for config)
module.exports = {
    server: {
        src: [
            'gruntfile.js',
            'server.js',
            'server/config/**/*.js',
            'server/models/**/*.js',
            'server/modules/**/*.js'
        ],
        options: {
            jshintrc: true
        }
    },
    client: {
        src: [
            'client/*.js',
            'client/modules/**/*.js'
        ],
        options: {
            jshintrc: true
        }
    }
};
