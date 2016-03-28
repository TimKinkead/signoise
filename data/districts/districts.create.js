'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url'),
    chalk = require('chalk');

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
 * Send POST request to local or production server.
 * - district creation logic handles upsert, & references to website / social accounts
 * @param district - cleaned up district object
 * @param index - the index of the district object in the districts array per districts.json
 * @param total - the totak number of districts per districts.json
 */
function createDistrict(district, index, total) {
    if (!district) { return; }
    
    // make POST request
    request.post(
        {
            url: url.parse('http://'+host+'/data/district'),
            json: true,
            body: district
        },
        function(err, response, body) {
            if (err) {
                console.log(chalk.red.bold('\n* ERROR '+district.name+' *')); 
                console.log(chalk.red(err)); 
                console.log('\n');
                return;
            }
            if (index && total && index >= 100 && index % 100 === 0) {
                console.log(district.name);
                console.log(chalk.green('*** '+index+'/'+total+'('+Math.floor(index/total*100)+'%) ***'));
            }
        }
    );
}

//----------------------------------------------------------------------------------------------------------------------
// Main

console.log(chalk.green.bold('\nCreating Districts\n'));

// check host
// - 'local' creates districts into database at localhost:3000
// - 'production' creates districts into database at signoise.prevagroup.com
var host = process.argv[2];
if (host === 'local') { host = 'localhost:3000'; }
else if (host === 'production') { host = 'signoise.prevagroup.com'; }
else {
    console.log(chalk.red.bold('Error! host='+host));
    console.log(chalk.red('Please specify a valid host.'));
    console.log(chalk.red(' Use `node districts.create local` \n or `node districts.create production`'));
    return;
}

// create districts
var districts = require('./districts.json');
districts.forEach(function(district, i) {
    if (!district) { console.log(chalk.red.bold('Error! district['+i+'] not defined')); }
    district = cleanUpDistrict(district);
    createDistrict(district, i, districts.length);
});