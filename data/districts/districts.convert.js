'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies / Configuration

var Converter = require('csvtojson').Converter,
    fs = require('fs'),
    chalk = require('chalk'),
    
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
    }),

    readStream = fs.createReadStream('./districts.csv'),
    writeStream = fs.createWriteStream('./districts.json');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Convert districts.csv to districts.json
 * - remap headers to match Mongoose Schema for districts (for districts.create.js)
 */

console.log(chalk.green.bold('\nConverting Districts (csv to json)\n'));

readStream.pipe(converter).pipe(writeStream);