'use strict';

/**
 * Bulk Insert Social Seeds for Twitter via './twitter.geocodes.json'
 * - Run this script locally (with `node twitter.geocodes`), which pings production server.
 * - Make sure 'req.user' checks are commented out in '../socialseed.create.js' on production server.
 */

//----------------------------------------------------------------------------------------------------------------------
// Dependencies
var request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Methods

// save a single geocode social seed
function saveGeoCode(geocode, index, total) {
    if (!geocode || !geocode.latitude || !geocode.longitude || !geocode.radius) {
        console.log('\n* NOT SAVING *');
        console.log(geocode);
        console.log('\n');
        return;
    }
    
    request.post(
        {
            url: url.parse('http://localhost:3000/data/socialseed'),
            json: true,
            body: {'platform': 'twitter', twitter: geocode, 'frequency': 'daily'}
        },
        function(err, response, body) {
            if (err) {
                console.log('\n* ERROR *'); 
                console.log(geocode);
                console.log(err); 
                console.log('\n');
                return;
            }

            if (index && total && index >= 5 && index % 5 === 0) {
                console.log(index + '/' + total + '(' + Math.floor(index / total * 100) + '%)');
            }
        }
    );
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Loop through geocodes and save as social seeds.
 * - Use setTimeout to spread out requests.
 */
function bulkInsert() {
    console.log('\n-- saving geocodes --\n');

    var geocodes = require('./twitter.geocodes.json'),
        total = geocodes.length;

    var timeout = 0,
        timeoutInc = 50;
    geocodes.forEach(function(gc, index) {
        function saveThisGeoCode() {saveGeoCode(gc, index, total);}
        setTimeout(saveThisGeoCode, timeout);
        timeout += timeoutInc;
    });
}

// start
bulkInsert();

