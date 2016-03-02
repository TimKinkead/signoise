'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Return user settings.
 */
exports.readSettings = function(req, res) {
    logger.filename(__filename);

    if (!req.user) {
        error.log(new Error('!req.user'));
        return res.status(500).send({
            header: 'Settings Error!',
            message: 'Please login if you want to manage your settings.'
        });
    }

    // done
    return res.status(200).send({
        email: req.user.email,
        admin: req.user.admin,
        facebook: req.user.facebook,
        instagram: req.user.instagram,
        twitter: req.user.twitter
    });
};