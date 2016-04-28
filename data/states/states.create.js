'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url'),
    chalk = require('chalk');

//----------------------------------------------------------------------------------------------------------------------
// Main

console.log(chalk.green.bold('\nCreating States\n'));

// check host
// - 'local' upserts states into database at localhost:3000
// - 'production' upserts states into database at signoise.prevagroup.com
var host = process.argv[2];
if (host === 'local') { host = 'localhost:3000'; }
else if (host === 'production') { host = 'signoise.prevagroup.com'; }
else {
    console.log(chalk.red.bold('Error! host='+host));
    console.log(chalk.red('Please specify a valid host.'));
    console.log(chalk.red(' Use `node states.create local` \n or `node states.create production`'));
    return;
}

// state data
var states = require('./states.json').features,
    stateIndex = 0;

// create states
function createState() {

    function nextState() {
        if ((stateIndex+1) >= states.length) {
            console.log(chalk.green.bold('Done creating ' + states.length + ' states.'));
            return;
        }
        stateIndex++;
        createState();
    }

    // error handling
    if (!states[stateIndex]) {
        console.log(chalk.red.bold('\nError: !states['+stateIndex+']\n'));
        nextState();
        return;
    }
    
    // init state
    var state = {
        name: states[stateIndex].properties.NAME.toLowerCase(),
        code: states[stateIndex].properties.STATE,
        geoId: states[stateIndex].properties.GEO_ID,
        geometry: states[stateIndex].geometry
    };

    // make POST request to server to create state
    // TODO - resolve alaska error (geometry is too large)
    request.post(
        {
            url: url.parse('http://'+host+'/data/state'),
            json: true,
            body: state
        },
        function(err, response, body) {
            if (err) {
                console.log(chalk.red.bold('\nError: '+state.name));
                console.log(chalk.red(err));
                console.log('\n');
            } else {
                console.log(chalk.green((stateIndex+1)+'/'+states.length+' '+state.name));
            }
            console.log(body);
            nextState();
        }
    );
}

// start process
createState();