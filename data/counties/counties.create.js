'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url'),
    chalk = require('chalk');

//----------------------------------------------------------------------------------------------------------------------
// Main

console.log(chalk.green.bold('\nCreating Counties\n'));

// check host
// - 'local' upserts counties into database at localhost:3000
// - 'production' upserts counties into database at signoise.prevagroup.com
var host = process.argv[2];
if (host === 'local') { host = 'localhost:3000'; }
else if (host === 'production') { host = 'signoise.prevagroup.com'; }
else {
    console.log(chalk.red.bold('Error! host='+host));
    console.log(chalk.red('Please specify a valid host.'));
    console.log(chalk.red(' Use `node counties.create local` \n or `node counties.create production`'));
    return;
}

// county data
var counties = require('./counties.json').features,
    countyIndex = 0;

// create counties
function createCounty() {

    function nextCounty() {
        if ((countyIndex+1) >= counties.length) {
            console.log(chalk.green.bold('Done creating ' + counties.length + ' counties.'));
            return;
        }
        countyIndex++;
        createCounty();
    }

    // error handling
    if (!counties[countyIndex]) {
        console.log(chalk.red.bold('\nError: !counties['+countyIndex+']\n'));
        nextCounty();
        return;
    }
    
    // init county
    var county = {
        name: counties[countyIndex].properties.NAME.toLowerCase(),
        state: counties[countyIndex].properties.STATE,
        code: counties[countyIndex].properties.COUNTY,
        geoId: counties[countyIndex].properties.GEO_ID,
        geometry: counties[countyIndex].geometry
    };

    // make POST request to server to create county
    request.post(
        {
            url: url.parse('http://'+host+'/data/county'),
            json: true,
            body: county
        },
        function(err, response, body) {
            if (err) {
                console.log(chalk.red.bold('\nError: '+county.name));
                console.log(chalk.red(err));
                console.log('\n');
            } else {
                console.log(chalk.green((countyIndex+1)+'/'+counties.length+' '+county.name));
            }
            console.log(body);
            nextCounty();
        }
    );
}

// start process
createCounty();