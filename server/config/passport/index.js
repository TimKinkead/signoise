'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var passport = require('passport'),
	path = require('path');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
	User = mongoose.model('User');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var file = require('../../modules/file');

//----------------------------------------------------------------------------------------------------------------------
// Methods

module.exports = function() {

	// Serialize sessions
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// Deserialize sessions
	passport.deserializeUser(function(id, done) {
		User.findOne({
			_id: id
		}, '-salt -password', function(err, user) {
			done(err, user);
		});
	});

	// Initialize strategies
	file.globber('server/config/passport/strategies/*.js').forEach(function(strategy) {
		require(path.resolve(strategy))();
	});

};
