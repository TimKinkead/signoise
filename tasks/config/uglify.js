'use strict';

// minify client js files
module.exports = function (util) {

    // get list of library files & app files
    // minify into two files & save in public directory

    var list = require('../../client/config');
    function addClient(files) {
        files.map(function(path, index) { files[index] = 'client/' + path; });
    }
    addClient(list.libFiles);
    addClient(list.appFiles);

    return {
        build: {
            files: [
                {
                    dest: 'public/lib.min.js',
                    src: list.libFiles
                },
                {
                    dest: 'public/app.min.js',
                    src: list.appFiles
                },
                {
                    dest: 'public/templates.min.js',
                    src: 'public/templates.js'
                }
            ],
            options: {
                mangle: {
                    except: ['angular']
                } // :false for none
            }
        }
    };
};
