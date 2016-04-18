'use strict';

var less_src = 'client/modules/core/less/core.less';

// compile less to css
module.exports = {
    development: {
        dest: 'client/styles.css',
            src: less_src
    },
    build: {
        dest: 'public/styles.css',
        src: less_src,
        options: {
            cleancss: true,
            compress: true
        }
    }
};
