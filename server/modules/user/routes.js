'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var user = require('../user');

//----------------------------------------------------------------------------------------------------------------------
// Routes

module.exports = function(app) {

    // -- SIGN UP/IN/OUT --

    // sign up
    app.route('/data/user/sign-up')
        .post(user.signUp);

    // sign in
    app.route('/data/user/sign-in')
        .post(user.signIn);

    // sign out
    app.route('/data/user/sign-out')
        .get(user.signOut);

    // -- PASSWORD --

    // forgot password
    app.route('/data/user/pswd-forgot')
        .post(user.forgotPassword);

    // reset password
    app.route('/data/user/pswd-reset')
        .post(user.resetPassword);
    
    // -- SETTINGS --

    // get & update settings
    app.route('/data/user/settings')
        .get(user.readSettings)
        .put(user.updateSettings);

    // -- FACEBOOK --
    /*
    // connect facebook account
    app.route('/data/user/facebook/connect')
        .get(user.facebookAuthorization);

    // connect facebook account callback
    app.route('/data/user/facebook/connect/clbk')
        .get(user.facebookConnect);

    // disconnect facebook account
    app.route('/data/user/facebook/disconnect')
        .get(user.facebookDisconnect);
    */
    // -- INSTAGRAM --
    /*
    // connect instagram account
    app.route('/data/user/instagram/connect')
        .get(user.instagramAuthorization);

    // connect instagram account callback
    app.route('/data/user/instagram/connect/clbk')
        .get(user.instagramConnect);

    // disconnect instagram account
    app.route('/data/user/instagram/disconnect')
        .get(user.instagramDisconnect);
    */
    // -- TWITTER --

    // connect twitter account
    app.route('/data/user/twitter/connect')
        .get(user.twitterAuthorization);

    // connect twitter account callback
    app.route('/data/user/twitter/connect/clbk')
        .get(user.twitterConnect);

    // disconnect twitter account
    app.route('/data/user/twitter/disconnect')
        .get(user.twitterDisconnect);

};