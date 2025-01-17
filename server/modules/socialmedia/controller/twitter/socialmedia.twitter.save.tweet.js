'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    SocialSeed = mongoose.model('SocialSeed'),
    WebPage = mongoose.model('WebPage'),
    WebSite = mongoose.model('WebSite');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../../error'),
    logger = require('../../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Save new social seeds to mongodb based on hashtags and user_mentions from a tweet.
 * - Use setTimeout to spread out saving social seeds to avoid mongodb duplicate key errors.
 * - Log errors here b/c no clbk.
 * @param queries - an array of queries
 */
function saveSocialSeeds(queries) {
    if (!queries) {return;}

    // create or update a single social seed
    function saveSocialSeed(query) {

        // check if social seed already exists in mongodb
        SocialSeed.findOne({platform: 'twitter', 'twitter.query': query}, function(err, seedDoc) {
            if (err) {return error.log(new Error(err));}

            // update social seed if it already exists
            if (seedDoc) {
                SocialSeed.update({_id: seedDoc._id}, {$inc: {references: 1}}, function(err) {
                    if (err) {return error.log(new Error(err));}
                });
            }

            // otherwise create new social seed
            else {
                SocialSeed.create({platform: 'twitter', twitter: {query: query}, references: 1}, function(err, newPageDoc) {
                    if (err) {return error.log(new Error(err));}
                });
            }
        });
    }

    var timeout = 0,
        timeoutInc = 1000; // 1 sec delay

    // save each query as a social seed
    queries.forEach(function(cV) {
        setTimeout(function() {saveSocialSeed(cV);}, timeout);
        timeout += timeoutInc;
    });
}

// create or update a single website

/**
 * Create or update a single website.
 * @param webpage - webpage doc
 * @param clbk - return clbk(err)
 */
function saveWebSite(webpage, clbk) {
    if (!webpage) { return clbk(new Error('!webpage')); }
    if (!webpage.subdomain) { return clbk(new Error('!webpage.subdomain')); }

    // check if website already exists in mongodb
    WebSite.findOne({subdomain: webpage.subdomain}, function(err, siteDoc) {
        if (err) { return clbk(new Error(err)); }

        // update website if it already exists
        if (siteDoc) {
            WebSite.update({_id: siteDoc._id}, {$inc: {socialReferences: 1}}, function(err) {
                if (err) { return clbk(new Error(err)); }
                return clbk();
            });
        }

        // otherwise create new website (domain & subdomain set via pre-validation hook)
        else {
            WebSite.create({url: webpage.url, socialReferences: 1}, function(err, newSiteDoc) {
                if (err) { return clbk(new Error(err)); }
                return clbk();
            });
        }
    });
}

/**
 * Save new webpage docs to mongodb based on urls from a tweet.
 * - Use setTimeout to spread out saving webpages to avoid mongodb duplicate key errors.
 * - Log errors here b/c no clbk.
 * @param urls - an array of urls
 */
function saveWebPages(urls) {
    if (!urls) {return;}
    if (!urls.length) {return;}

    // create or update a single webpage
    var urlIndex = 0;
    function saveWebPage() {
        var url = urls[urlIndex];

        function nextUrl() {
            urlIndex++;
            if (urls[urlIndex]) { saveWebPage(); }
        }

        // check if webpage already exists in mongodb
        WebPage.findOne({url: url}, function(err, pageDoc) {
            if (err) { error.log(new Error(err)); nextUrl(); return; }

            // update webpage if it already exists
            if (pageDoc) {
                WebPage.update({_id: pageDoc._id}, {$inc: {socialReferences: 1}}, function(err) {
                    if (err) { error.log(new Error(err)); nextUrl(); return; }
                    saveWebSite(pageDoc, function(err) {
                        if (err) { error.log(err); nextUrl(); return; }
                        nextUrl();
                    });
                });
            }

            // otherwise create new webpage
            else {
                WebPage.create({url: url, socialReferences: 1}, function(err, newPageDoc) {
                    if (err) { error.log(new Error(err)); nextUrl(); return; }
                    if (!newPageDoc) { error.log(new Error('newPageDoc')); nextUrl(); return; }
                    saveWebSite(newPageDoc, function(err) {
                        if (err) { error.log(err); nextUrl(); return; }
                        nextUrl();
                    });
                });
            }
        });
    }

    // start
    if (urls[urlIndex]) {saveWebPage();}
}

/**
 * Check tweet entities for hashtags, user_mentions, and urls.
 * - Create new social seeds & webpages if necessary.
 * @param entities - twitter entities object
 */
function checkTweetEntities(entities) {
    if (!entities) {return;}

    // hashtags
    if (entities.hashtags) {
        var hashtags = [];
        entities.hashtags.forEach(function(cV) {
            if (cV.text) {hashtags.push('#'+cV.text.toLowerCase());}
        });
        saveSocialSeeds(hashtags);
    }

    // user mentions
    if (entities.user_mentions) {
        var user_mentions = [];
        entities.user_mentions.forEach(function(cV) {
            if (cV.screen_name) {user_mentions.push('@'+cV.screen_name.toLowerCase());}
        });
        saveSocialSeeds(user_mentions);
    }

    // urls
    if (entities.urls) {
        var urls = [];
        entities.urls.forEach(function(cV) {
            if (cV.expanded_url) {urls.push(cV.expanded_url.toLowerCase());}
        });
        saveWebPages(urls);
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.TWITTER.SAVE.TWEET
 * - Save a tweet to the mongodb socialmedia collection.
 * @param tweet - the tweet object from twitter
 * @param seed - the social seed used to pull the social media (optional)
 * @param clbk - return clbk(err, newTweet)
 */
exports.saveTweet = function(tweet, seed, clbk) {
    //logger.filename(__filename);
    
    if (!tweet) {return clbk(new Error('!tweet'));}

    // handle optional seed parameter
    if (!clbk) { clbk = seed; seed = null; }

    // check if tweet already exists in mongodb
    SocialMedia.findOne({platform: 'twitter', 'data.id': tweet.id}, function(err, mediaDoc) {
        if (err) {return clbk(new Error(err));}

        // update tweet data if it already exists
        if (mediaDoc) {
            var update = {$set: {data: tweet, modified: new Date()}};
            if (seed) {
                if (seed._id) { update.$set.seed = seed._id; }
                if (seed.district) { update.$set.district = seed.district; }
                if (seed.county) { update.$set.county = seed.county; }
                if (seed.state) { update.$set.state = seed.state; }
            }
            SocialMedia.update(
                {_id: mediaDoc._id},
                update,
                function(err) {
                    if (err) {return clbk(new Error(err));}

                    // done
                    return clbk(null, false);
                }
            );
        }

        // otherwise save new tweet
        else {
            var socialmedia = new SocialMedia({
                platform: 'twitter',
                data: tweet
            });
            if (seed) {
                if (seed._id) { socialmedia.socialseed = seed._id; }
                if (seed.district) { socialmedia.district = seed.district; }
                if (seed.county) { socialmedia.county = seed.county; }
                if (seed.state) { socialmedia.state = seed.state; }
                if (seed.twitter && seed.twitter.longitude && seed.twitter.latitude) {
                    socialmedia.location = [seed.twitter.longitude, seed.twitter.latitude];
                }
            }
            socialmedia.save(function(err) {
                if (err) {return clbk(new Error(err));}

                // check tweet entities for hashtags, user_mentions, and urls
                if (tweet.entities) {checkTweetEntities(tweet.entities);}

                // done
                return clbk(null, true);
            });
        }
    });
};