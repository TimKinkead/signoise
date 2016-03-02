'use strict';

// production only
// minify client html files
module.exports = {
    build: {
        dest: 'public/templates.js',
        src: [
            'client/modules/**/*.html'
        ]
    },
    options: {
        module: 'app',
        singleModule: true,
        existingModule: true,

        rename: function (name) {
            return name.substr('../client/'.length);
        },

        quoteChar: '\'',
        htmlmin: {
            removeComments: true,
            collapseWhitespace: true
        }
    }
};
