'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var Converter = require('csvtojson').Converter,
    fs = require('fs'),
    request = require('request'),
    url = require('url'),
    _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    District = mongoose.model('District'),
    State = mongoose.model('State'),
    County = mongoose.model('County'),
    SocialSeed = mongoose.model('SocialSeed'),
    WebSite = mongoose.model('WebSite');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Clean up district before creating.
 * - twitter & facebook
 * - remove unnecessary fields
 * @param district - district object from districts.json
 * @returns {*} - return clean district object
 */
function cleanUpDistrict(district) {
    if (!district) {return null;}
    
    // extract twitter screen_name
    if (district.twitter) {
        district.twitterAccount = '@'+district.twitter.replace(/https?:\/\/(www.)?twitter.com\//, '');
        if (district.twitterAccount.indexOf('/') > -1) {
            district.twitterAccount = district.twitterAccount.slice(0, district.twitterAccount.indexOf('/'));   
        }
        district.twitterAccount = district.twitterAccount.toLowerCase();
    }
    
    // extract facebook page name
    if (district.facebook) {
        district.facebookAccount = district.facebook.replace(/https?:\/\/(www.)?facebook.com\//, '');
        district.facebookAccount = district.facebookAccount.replace('pages/', '');
        district.facebookAccount = district.facebookAccount.replace('?fref=ts', '');
        district.facebookAccount = district.facebookAccount.replace('?ref=aymt_homepage_panel', '');
        while (/[-\/]/.test(district.facebookAccount)) {
            district.facebookAccount = district.facebookAccount.replace(/[-\/]/, ' ');
        }
    }
    
    // clean up other fields
    if (district.studentCount && typeof district.studentCount !== 'number') { delete district.studentCount; }
    if (district.lepCount && typeof district.lepCount !== 'number') { delete district.lepCount; }
    if (district.iepCount && typeof district.iepCount !== 'number') { delete district.iepCount; }
    if (district.frlCount && typeof district.frlCount !== 'number') { delete district.frlCount; }
    if (district.fetchCount && typeof district.fetchCount !== 'number') { delete district.fetchCount; }
    if (district.modified) { district.modified = new Date(district.modified); }
    
    // delete unnecessary fields
    var fields = [
        'name', 'cdsId', 'ncesId',
        'website', 'facebookAccount', 'twitterAccount',
        'street', 'city', 'state', 'zip', 'county',
        'latitude', 'longitude',
        'studentCount', 'lepCount', 'iepCount', 'frlCount', 'fetchCount',
        'modified'
    ];
    for (var key in district) {
        if (district.hasOwnProperty(key)) {
            if (fields.indexOf(key) < 0) {
                delete district[key];
            }
        }
    }

    // location
    if (district.longitude && district.latitude) {
        district.location = [district.longitude, district.latitude];
        delete district.longitude;
        delete district.latitude;
    }
    
    // done
    return district;
}

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
    if (!webUrl || webUrl.indexOf('http') !== 0) { return clbk(); }

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

/**
 * Upsert districts from 'districts.json'.
 */
function upsertDistricts() {
    
    var districts = require('../data/districts.json'),
        districtIndex = 0;

    // create districts
    function createDistrict() {
        
        function nextDistrict() {
            if ((districtIndex+1) >= districts.length) {
                logger.bold('Done creating ' + districts.length + ' districts.');
                return;
            }
            districtIndex++;
            createDistrict();
        }

        // init district
        var district = cleanUpDistrict(districts[districtIndex]);
        if (!district) { error.log(new Error('!district')); nextDistrict(); return; }

        // get state
        State.findOne({abbv: district.state}, function(err, stateDoc) {
            if (err) { error.log(new Error(err)); nextDistrict(); return; }
            if (!stateDoc) { error.log(new Error('!stateDoc')); nextDistrict(); return; }
            district.state = stateDoc._id;
            
            // get county
            if (!district.county) { error.log(new Error('!district.county')); nextDistrict(); return; }
            County.findOne({name: district.county.toLowerCase()}, function(err, countyDoc) {
                if (err) { error.log(new Error(err)); nextDistrict(); return; }
                if (!countyDoc) { error.log(new Error('!countyDoc')); nextDistrict(); return; }
                district.county = countyDoc._id;

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
                                if (err) { error.log(new Error(err)); nextDistrict(); return; }

                                // update district if it exists
                                if (districtDoc) { districtDoc = _.extend(districtDoc, district); }

                                // otherwise create new district
                                else { districtDoc = new District(district); }

                                // save new or updated district doc
                                districtDoc.save(function(err) {
                                    if (err) { error.log(new Error(err)); nextDistrict(); return; }

                                    // done
                                    logger.result(district.name + ' district created');
                                    nextDistrict();
                                });
                            });
                    });
                });  
            });
        });
    }

    // start
    createDistrict();
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * INIT.DISTRICTS
 * - Convert '../data/districts.csv' to '../data/districts.json'.
 * - Upsert a district doc for each district.
 */
exports.districts = function(req, res) {
    logger.filename(__filename);
    
    // convert districts.csv to districts.json
    var readStream = fs.createReadStream('./server/modules/init/data/districts.csv'),
        writeStream = fs.createWriteStream('./server/modules/init/data/districts.json'),
        converter = new Converter({
            constructResult: false,
            toArrayString: true,
            headers: [
                'cdsId',            // 'CDSCode',
                'ncesId',           // 'NCESDist',
                'county',           // 'County',
                'name',             // 'District',
                'street',           // 'Street',
                'city',             // 'City',
                'zip',              // 'Zip',
                'state',            // 'State',
                'Website (Orig)',       // ignored - see below
                'DOC',                  // ignored
                'DOCType',              // ignored
                'latitude',         // 'Latitude',
                'longitude',        // 'Longitude',
                'modified',         // 'LastUpdate',
                'studentCount',     // 'Student Count',
                'lepCount',         // 'LEP',
                'iepCount',         // 'IEP',
                'frlCount',         // 'FRL',
                'fetchCount',
                'twitter',          // 'Twitter Account',
                'facebook',         // 'Facebook Account',
                'Verified',             // ignored
                'Comment',              // ignored
                'website'           // 'Final Website (Redirect or lookup)'
            ]
        });
    readStream.pipe(converter).pipe(writeStream)
        .on('error', function(err) {
            error.log(new Error(err));
            return res.status(500).send(err);
        })
        .on('close', function() {
            upsertDistricts();
            return res.status(200).send('Working on initializing districts.');
        });
};