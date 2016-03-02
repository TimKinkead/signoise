'use strict';

module.exports = function (grunt) {
    grunt.registerTask(
        'build',
        'Generate compiled files.',
        function () {
            var taskList = [];

            // build
            taskList = taskList.concat([
                // clean up & check
                'clean:public',
                'jshint',

                // create 'public' files
                'less:build',
                'htmlmin:build',
                'html2js:build',
                'uglify:build',
                'copy:build'
            ]);

            grunt.task.run(taskList);
        }
    );
};
