'use strict';

/**
 * CORE.UNSUPPORTED
 * - Render unsupported.html
 */
exports.unsupported = function(req, res) {

	// parameters passed to unsupported.html
	var params = {
        title: 'Unsupported!',
        description: 'Please upgrade your browser.',
        keywords: '',
        favicon: (process.env.NODE_ENV === 'production' ? '' : 'modules/core/img/') + 'favicon.ico'
    };

    // render unsupported.html
	res.render('unsupported', params);
};
