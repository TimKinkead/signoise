'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    District = mongoose.model('District'),
    SocialSeed = mongoose.model('SocialSeed'),
    WebSite = mongoose.model('WebSite');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Find or create twitter social seed for a specific screen name.
 * @param screenName - twitter account screen_name
 * @param clbk - return clbk(err, socialseed)
 */
function getTwitterSeed(screenName, clbk) {
    if (!screenName) { return clbk(); }

    // check if seed already exists
    SocialSeed.findOne({platform: 'twitter', 'twitter.query': screenName})
        .exec(function(err, seedDoc) {
            if (err) { return clbk(new Error(err)); }

            // return seed if it exists
            if (seedDoc) { return clbk(null, seedDoc); }
            
            // otherwise create new seed
            SocialSeed.create(
                {platform: 'twitter', twitter: {query: screenName}, frequency: 'daily'}, 
                function(err, newSeedDoc) {
                    if (err) { return clbk(new Error(err)); }
                    if (!newSeedDoc) { return clbk(new Error('!newSeedDoc')); }
                    return clbk(null, newSeedDoc);
                }
            );
        });
}

/**
 * Find or create website doc for a url.
 * @param webUrl - the url of a website
 * @param clbk - return clbk(err, websiteDoc)
 */
function getWebSite(webUrl, clbk) {
    if (!webUrl) { return clbk(); }

    // grab subdomain
    var subdomain = WebSite.getUrlData(webUrl).subdomain;
    if (!subdomain) { return clbk(new Error('!subdomain for url='+webUrl)); }
    
    // check if website already exists in mongodb
    WebSite.findOne({subdomain: subdomain}, function(err, siteDoc) {
        if (err) { return clbk(new Error(err)); }

        // return website if it exists
        if (siteDoc) { return clbk(null, siteDoc); }

        // otherwise create new website (domain & subdomain set via pre-validation hook)
        WebSite.create({url: webUrl}, function(err, newSiteDoc) {
            if (err) { return clbk(new Error(err)); }
            if (!newSiteDoc) { return clbk(new Error('!newSiteDoc')); }
            return clbk(null, newSiteDoc);
        });
    });
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * DISTRICT.CREATE
 * - Create a district.
 */
exports.create = function(req, res) {
    logger.filename(__filename);

    var district = req.body;

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Create District Error!',
            message: message || 'We had trouble creating the district. Please try again.'
        });
    }

    // commented out for bulk insert
    //if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to create a district.');}
    //if (!req.user.admin) {return errorMessage(403, 'Only admins can create districts.');}

    // get facebook account social seed
    // - this has to be done manually :(

    // get twitter account social seed
    getTwitterSeed(district.twitterAccount, function(err, twitterSeed) {
        if (err) { error.log(err); }
        if (twitterSeed) { district.twitterSeed = twitterSeed._id; }
        if (district.twitterAccount) { delete district.twitterAccount; }

        // get website
        getWebSite(district.website, function(err, websiteDoc) {
            if (err) { error.log(err); }
            if (websiteDoc) { district.website = websiteDoc._id; }
            else { delete district.website; }

            // check if district already exists
            District.findOne({cdsId: district.cdsId, ncesId: district.ncesId})
                .exec(function(err, districtDoc) {
                    if (err) {error.log(new Error(err)); return errorMessage();}

                    // update district if it exists
                    if (districtDoc) { districtDoc = _.extend(districtDoc, district); }

                    // otherwise create new district
                    else { districtDoc = new District(district); }

                    // save new or updated district doc
                    districtDoc.save(function(err) {
                        if (err) {error.log(new Error(err)); return errorMessage();}

                        // done
                        logger.result('district created');
                        return res.status(200).send(districtDoc);
                    });
                });
        });
    });
};