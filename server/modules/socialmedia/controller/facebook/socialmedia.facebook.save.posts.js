'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var savePost = require('./socialmedia.facebook.save.post.js').saveFacebookPost;

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.FACEBOOK.SAVE.POSTS
 * - Save posts to socialmedia mongodb collection.
 * - Use setTimeout to spread out saving posts to avoid mongodb duplicate key errors.
 * @param posts - an array of post objects
 * @param seed - the social seed used to pull the social media (optional)
 * @param clbk - return clbk(errs, newPosts)
 */
exports.saveFacebookPosts = function(posts, seed, clbk) {
    if (!posts) {return clbk([new Error('!posts')]);}
    if (!posts.length) {return clbk(null, 0);}

    // handle optional seed parameter
    if (!clbk) { clbk = seed; seed = null; }

    var errs = [],
        newPosts = 0,
        timeout = 0,
        timeoutInc = 1000; // 1 sec delay

    // check done
    var cnt = posts.length;
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            if (!errs.length) {errs = null;}
            return clbk(errs, newPosts);
        }
    }

    // save each post
    posts.forEach(function(cV) {

        function saveThisPost() {
            savePost(cV, seed, function(err, newPost) {
                if (err) {errs.push(err);}
                if (newPost) {newPosts += 1;}
                checkDone();
            });
        }

        // save this post
        setTimeout(saveThisPost, timeout);
        timeout += timeoutInc;
    });
};