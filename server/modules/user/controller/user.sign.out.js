'use strict';

exports.signOut = function(req, res) {
    req.logout();
    return res.redirect('/');
};
