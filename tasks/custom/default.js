'use strict';

module.exports = function (grunt) {
    grunt.registerTask('default', [
        'clean:public',
        'client',
        'server'
    ]);
};
