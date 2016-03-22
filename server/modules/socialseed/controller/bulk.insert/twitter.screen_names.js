'use strict';

/**
 * Bulk Insert Social Seeds for Twitter via './twitter.screen_names.json'
 * - Run this script locally (with `node twitter.sccreen_names`), which pings production server.
 * - Make sure 'req.user' checks are commented out in '../socialseed.create.js' on production server.
 */

//----------------------------------------------------------------------------------------------------------------------
// Dependencies
var request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Methods

// save a single screen name
function saveScreenName(sn, index, total) {
    if (!sn || sn.indexOf('@') !== 0 || sn.indexOf(' ') > -1) {return console.log('\n* NOT SAVING '+sn+' *\n');}
    
    request.post(
        {
            url: url.parse('http://signoise.prevagroup.com/data/socialseed'),
            json: true,
            body: {'platform': 'twitter', twitter: {query: sn}, 'frequency': 'daily'}
        },
        function(err, response, body) {
            if (err) {console.log('\n* ERROR '+sn+' *'); console.log(err); console.log('\n'); return;}
            console.log(sn);
            if (index && total && index >= 100 && index % 100 === 0) {
                console.log('\n*** '+index+'/'+total+'('+Math.floor(index/total*100)+'%) ***\n');
            }
        }
    );
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Loop through screen names and save as social seeds.
 * - Use setTimeout to spread out requests.
 */
function bulkInsert() {
    console.log('\n-- saving screen names --\n');

    var screenNames = require('./twitter.screen_names_2.json'),
        total = screenNames.length;

    var timeout = 0,
        timeoutInc = 50;
    screenNames.forEach(function(sn, index) {
        function saveThisScreenName() {saveScreenName(sn, index, total);}
        setTimeout(saveThisScreenName, timeout);
        timeout += timeoutInc;
    });
}

// start
//bulkInsert();

