'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    WebPage = mongoose.model('WebPage'),
    WebSite = mongoose.model('WebSite');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../../error');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Check post for links & save new webpage docs.
 * - Create new webpages if necessary.
 * @param post - facebook post object
 */
function checkPostForLinks(post) {
    if (!post) {return;}

    var timeout = 0,
        timeoutInc = 1000; // 1 sec delay

    // create or update a single website
    function saveWebSite(webpage) {
        if (!webpage) {return error.log(new Error('!webpage'));}
        if (!webpage.subdomain) {return error.log(new Error('!webpage.subdomain'));}

        // check if website already exists in mongodb
        WebSite.findOne({subdomain: webpage.subdomain}, function(err, siteDoc) {
            if (err) {return error.log(new Error(err));}

            // update website if it already exists
            if (siteDoc) {
                WebSite.update({_id: siteDoc._id}, {$inc: {socialReferences: 1}}, function(err) {
                    if (err) {error.log(new Error(err));}
                });
            }

            // otherwise create new website (domain & subdomain set via pre-validation hook)
            else {
                WebSite.create({url: webpage.url, socialReferences: 1}, function(err, newSiteDoc) {
                    if (err) {error.log(new Error(err));}
                });
            }
        });
    }

    // create or update a single webpage
    function saveWebPage(url) {

        // check if webpage already exists in mongodb
        WebPage.findOne({url: url}, function(err, pageDoc) {
            if (err) {return error.log(new Error(err));}

            // update webpage if it already exists
            if (pageDoc) {
                WebPage.update({_id: pageDoc._id}, {$inc: {socialReferences: 1}}, function(err) {
                    if (err) {return error.log(new Error(err));}
                    saveWebSite(pageDoc);
                });
            }

            // otherwise create new webpage
            else {
                WebPage.create({url: url, socialReferences: 1}, function(err, newPageDoc) {
                    if (err) {return error.log(new Error(err));}
                    if (!newPageDoc) {return error.log(new Error('!newPageDoc'));}
                    saveWebSite(newPageDoc);
                });
            }
        });
    }

    if (post.type && post.type === 'link' && post.attachments && post.attachments.data && post.attachments.data.length) {
        var attachments = post.attachments.data;
        attachments.forEach(function(cV) {
            if (cV.url) {
                setTimeout(function() {saveWebPage(cV.url);}, timeout);
                timeout += timeoutInc;
            }
        });
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.FACEBOOK.SAVE.POST
 * - Save a post to the mongodb socialmedia collection.
 * @param post - the post object from facebook
 * @param seed - the social seed used to pull this post (optional)
 * @param clbk - return clbk(err, newPost)
 */
exports.saveFacebookPost = function(post, seed, clbk) {
    if (!post) {return clbk(new Error('!post'));}

    // handle optional seed parameter
    if (!clbk) { clbk = seed; seed = null; }

    // check if post already exists in mongodb
    SocialMedia.findOne({platform: 'facebook', 'data.id': post.id}, function(err, mediaDoc) {
        if (err) {return clbk(new Error(err));}

        // update post data if it already exists
        if (mediaDoc) {
            SocialMedia.update(
                {_id: mediaDoc._id},
                {$set: {data: post, modified: new Date()}},
                function(err) {
                    if (err) {return clbk(new Error(err));}

                    // done
                    return clbk(null, false);
                }
            );
        }

        // otherwise save new post
        else {
            SocialMedia.create(
                {platform: 'facebook', data: post, socialseed: seed._id},
                function(err, newMediaDoc) {
                    if (err) {return clbk(new Error(err));}

                    // check post for webpage links
                    checkPostForLinks(post);

                    // done
                    return clbk(null, true);
                }
            );
        }
    });
};