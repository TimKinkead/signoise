'use strict';

/**
 * CORE.INDEX
 * - Render index.html (the angular application skeleton).
 */
exports.index = function(req, res) {

	// parameters passed to index.html
	var params = {
        title:  'Signal in the Noise',
        description:  'A Preva Group Project',
        keywords:  'Preva Group, Signal in the Noise',
        files: process.env.NODE_ENV === 'production' ? ['lib.min.js', 'app.min.js', 'templates.min.js'] : require('../../../../client/config').jsFiles,
        favicon: (process.env.NODE_ENV === 'production' ? '' : 'modules/core/img/') + 'favicon.ico',
        user: req.user ? {_id: req.user._id, username: req.user.username, admin: req.user.admin} : null
    };

    // render index.html
	res.render('index', params);
};
