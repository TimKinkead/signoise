'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialSeed = mongoose.model('SocialSeed');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../../error'),
    logger = require('../../../logger'),
    socialmedia = require('../../../socialmedia');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Remove undefined groups, groups without a feed, and private groups.
 * @param groups - an array of groups
 */
function cleanupGroups(groups) {
    if (!groups) {return [];}

    for (var i=groups.length-1; i>=0; i--) {
        if (!groups[i] || !groups[i].feed || !groups[i].feed.data || !groups[i].privacy || groups[i].privacy !== 'OPEN') {
            groups.splice(i, 1);
        } else if (!groups[i].cover) {
            loop: {
                for (var j=0, x=groups[i].feed.data.length; j<x; j++) {
                    if (groups[i].feed.data[j] && groups[i].feed.data[j].picture) {
                        groups[i].cover = {source: groups[i].feed.data[j].picture};
                        break loop;
                    }
                }
            }
        }
    }

    return groups;
}

/**
 * Remove undefined pages and pages without a feed.
 * @param pages - an array of pages
 */
function cleanupPages(pages) {
    if (!pages) {return [];}

    for (var i=pages.length-1; i>=0; i--) {
        if (!pages[i] || !pages[i].feed || !pages[i].feed.data) {
            pages.splice(i, 1);
        } else if (!pages[i].cover) {
            loop: {
                for (var j=0, x=pages[i].feed.data.length; j<x; j++) {
                    if (pages[i].feed.data[j] && pages[i].feed.data[j].picture) {
                        pages[i].cover = {source: pages[i].feed.data[j].picture};
                        break loop;
                    }
                }
            }
        }
    }

    return pages;
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALSEED.FACEBOOK.SEARCH
 * - Search facebook for pages and groups to get fbId before creating a social seed.
 */
exports.searchFacebook = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Search Facebook Error!',
            message: message || 'We had trouble searching Facebook. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to search Facebook.');}
    if (!req.user.facebook) {return errorMessage(403, 'Please go to settings and connect your Facebook account.');}
    if (!req.query.query) {return errorMessage(400, 'Please provide a query term if you want to search Facebook.');}

    var results = {groups: [], pages: []},
        query = req.query.query.toLowerCase();

    // check done
    var cnt = 2;
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            return res.status(200).send(results);
        }
    }

    // get facebook access token
    socialmedia.getFacebookToken(req.user, function(err, accessToken) {
        if (err) {error.log(err); return errorMessage();}
        if (!accessToken) {error.log(new Error('!accessToken')); return errorMessage();}

        // search facebook groups
        socialmedia.facebookApiGet(
            'https://graph.facebook.com/v2.5/search'+
            '?access_token='+accessToken+
            '&q='+query+
            '&type=group'+
            '&fields=id,name,description,privacy,cover,feed{id,picture}',
            function(err, body) {
                if (err) {error.log(err);}
                else if (!body) {error.log(new Error('!body'));}
                else if (!body.data) {error.log(new Error('!body.data'));}
                else {results.groups = cleanupGroups(body.data);}
                checkDone();
            }
        );

        // search facebook pages
        socialmedia.facebookApiGet(
            'https://graph.facebook.com/v2.5/search'+
            '?access_token='+accessToken+
            '&q='+query+
            '&type=page'+
            '&fields=id,name,about,description,category,cover,feed{id,picture}',
            function(err, body) {
                if (err) {error.log(err);}
                else if (!body) {error.log(new Error('!body'));}
                else if (!body.data) {error.log(new Error('!body.data'));}
                else {results.pages = cleanupPages(body.data);}
                checkDone();
            }
        );
    });
};