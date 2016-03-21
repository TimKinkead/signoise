'use strict';

// production only
// copy files that do not need to be processed from 'client' to 'public'
module.exports = {
    build: {
        files: [
            {
                dest: 'public',
                src: [
                    'humans.txt', 'robots.txt',
                    'modules/core/img/favicon.ico',
                    'lib/bootstrap/fonts/**'
                ],
                cwd: 'client',
                expand: true
            }
        ]
    }
};
