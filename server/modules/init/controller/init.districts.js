'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var Converter = require('csvtojson').Converter,
    fs = require('fs'),
    request = require('request'),
    url = require('url');

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
                //console.log('delete '+key);
                delete district[key];
            }
        }
    }
    
    // done
    return district;
}

/**
 * Upsert districts from 'districts.json'.
 * @param host - req.get('host')
 */
function upsertDistricts(host) {
    
    var districts = require('../data/districts.json'),
        districtIndex = 0;

    // create district
    function createDistrict() {

        var district = cleanUpDistrict(districts[districtIndex]);
        
        function nextDistrict() {
            districtIndex++;
            if (districts[districtIndex]) {
                createDistrict();
            } else {
                logger.bold('done upserting districts');
            }
        }
        
        // make POST request
        // - district creation logic handles upsert, & references to website / social accounts
        request.post(
            {
                url: url.parse('http://'+host+'/data/district'),
                json: true,
                body: district
            },
            function(err, response, body) {
                if (err) {
                    logger.error(err);
                }
                if (districtIndex && districts.length && districtIndex >= 25 && districtIndex % 25 === 0) {
                    logger.dash(district.name);
                    logger.arrow('*** '+districtIndex+'/'+districts.length+'('+Math.floor(districtIndex/districts.length*100)+'%) ***');
                }
                nextDistrict();
            }
        );
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
            upsertDistricts(req.get('host'));
            return res.status(200).send('Working on initializing districts.');
        });
};