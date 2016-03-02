'use strict';

// production only
// minify client html files
module.exports = {
    build: {
        options: {
            removeComments: true,
            collapseWhitespace: true
        },
        files: [{
            dest: 'public',
            src: [
                'index.html',
                'unsupported.html'
            ],
            cwd: 'client',
            expand: true
        }]
    }
};
