'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	crypto = require('crypto');

//----------------------------------------------------------------------------------------------------------------------
// Schema

var UserSchema = new Schema({

    //_id: {type: ObjectId} // automatically created for each document

    // email
	email: {
		type: String,
		trim: true,
        lowercase: true,
		match: /.+\@.+\..+/,
        required: true
	},

    // password
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String
    },
    passwordResetCode: {
        type: String
    },
    passwordResetExp: {
        type: Date
    },

    // facebook
    facebookAccessToken: {
        type: String
    },

    // instagram
    instagramAccessToken: {
        type: String
    },

    // twitter
    twitterToken: {
        type: String
    },
    twitterSecret: {
        type: String
    },

    // permissions
    admin: {
        type: Boolean,
        default: true
    },

    // timestamp - when user signed up
	created: {
		type: Date,
		default: Date.now
	}
});

//----------------------------------------------------------------------------------------------------------------------
// Virtual Fields

/**
 * Virtual field for username.
 */
UserSchema.virtual('username').get(function() {
    return this.email ? this.email.slice(0, this.email.indexOf('@')) : 'user';
});

/**
 * Virtual field for checking if facebook account is connected.
 */
UserSchema.virtual('facebook').get(function() {
    return (this.facebookAccessToken);
});

/**
 * Virtual field for checking if instagram account is connected.
 */
UserSchema.virtual('instagram').get(function() {
    return (this.instagramAccessToken);
});

/**
 * Virtual field for checking if twitter account is connected.
 */
UserSchema.virtual('twitter').get(function() {
    return (this.twitterToken && this.twitterSecret);
});

//----------------------------------------------------------------------------------------------------------------------
// Instance Methods

/**
 * Instance method for hashing a password.
 */
UserSchema.methods.hashPassword = function(password) {
    if (this.salt && password) {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 64).toString('base64');
    } else {
        return password;
    }
};

/**
 * Instance method for authenticating user.
 */
UserSchema.methods.authenticate = function(password) {
    return this.password === this.hashPassword(password);
};

//----------------------------------------------------------------------------------------------------------------------
// Static Methods

// check if email is new to Betaknot
UserSchema.statics.checkNewEmail = function(email, clbk) {
    var User = this;
    if (!email) {return clbk(new Error('email is required'));}
    User.count({email: email})
        .exec(function(err, qty) {
            if (err) {return clbk(new Error(err));}
            return clbk(null, qty === 0);
        });
};

//----------------------------------------------------------------------------------------------------------------------
// Pre & Post Methods

/**
 * Pre validation hook to hash the password.
 */
UserSchema.pre('validate', function(next) {
	if (this.password) {
		this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
		this.password = this.hashPassword(this.password);
	}
	next();
});

//----------------------------------------------------------------------------------------------------------------------
// Initialize Model

mongoose.model('User', UserSchema);
