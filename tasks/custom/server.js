'use strict';

module.exports = function (grunt) {
    grunt.registerTask('server', [
        'jshint:server',
        'express:development'
    ]);
};
