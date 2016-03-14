'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
	User = mongoose.model('User');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * USER.SIGN.UP
 * - Create a new user and save doc to mongodb users collection.
 * - Log the user into the application.
 */
exports.signUp = function(req, res, next) {
	logger.filename(__filename);

    // error message
    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Sign Up Error!',
            message: message || 'We had trouble signing you up. Please try again.'
        });
    }

    if (!req.body.email || !req.body.password) {return errorMessage(400, 'Your email address and a password are required.');}

    // check email validity
    var patt = /\S+\@\S+\.\S+/;
    if (!patt.test(req.body.email)) {return errorMessage(400, 'Please provide a valid email address.');}
    if (req.body.email.indexOf('@prevagroup.com') < 0) {return errorMessage(403, 'You don\'t have permission to sign up.');}

    // initialize user doc
    var user = new User({
        email: req.body.email,
        password: req.body.password
    });

    // check existing users
    User.checkNewEmail(user.email, function(err, newEmail) {
        if (err) {error.log(new Error(err)); return errorMessage();}
        if (!newEmail) {return errorMessage(401, 'Your email address ('+user.email+') is already registered to an account. Please try logging in.');}

        // save user doc to mongodb users collection
        user.save(function(err) {
            if (err) {error.log(new Error(err)); return errorMessage();}

            // login user
            req.login(user, function(err) {
                if (err) {error.log(new Error(err)); return errorMessage(500, 'We created an account for you, but had trouble automatically logging you in. Please try logging in.');}

                // done
                logger.result('user signed up and logged in');
                return res.status(200).send({
                    _id: user._id,
                    username: user.username,
                    admin: user.admin
                });
            });
        });
    });
};
