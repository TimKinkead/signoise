'use strict';

module.exports = function (grunt) {
    grunt.registerTask('client', [
        'jshint:client',
        'less:development'
    ]);
};
