'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
	User = mongoose.model('User');

//----------------------------------------------------------------------------------------------------------------------
// Strategies

/**
 * Local Strategy
 */
module.exports = function() {

	// custom username / password options
	var options = {
		usernameField: 'email',
		passwordField: 'password'
	};

	// local strategy
	passport.use('local', new LocalStrategy(options, function(username, password, clbk) {

        console.log(username);
        console.log(password);

        // find user by email
        User.findOne({email: username}, function(err, user) {
            if (err) {return clbk(new Error(err));}

            // account not found
            if (!user) {
                return clbk({
                    custom: true,
                    code: 403,
                    message: 'Your email address didn\'t match our account records. Please sign up!'
                });
            }

            // account doesn't have password
            if (!user.password) {
                return clbk({
                    custom: true,
                    code: 401,
                    message: 'A password has not been set for your account. Click "Forgot your password?" and we\'ll email you a reset code.'
                });
            }

            console.log(user.password);
            console.log(user.salt);
            console.log(user.hashPassword(password));
            console.log(user.authenticate(password));

            // wrong password
            if (!user.authenticate(password)) {
                return clbk({
                    custom: true,
                    code: 401,
                    message: 'Wrong password! Try again or click "Forgot your password?"'
                });
            }

            // done
            return clbk(null, user);
        });
    }));
};
