'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var http = require('http'),
    mongoose = require('mongoose'),
	chalk = require('chalk');

//----------------------------------------------------------------------------------------------------------------------
// Start Server

console.log(chalk.green.bold('STARTING SERVER'));

// default environment variables
if (!process.env.NODE_ENV) {process.env.NODE_ENV = 'development';}
if (!process.env.SERVER) {process.env.SERVER = 'local';}
if (!process.env.PORT) {process.env.PORT = 3000;}
if (!process.env.DB_CONNECTION) {process.env.DB_CONNECTION = 'localhost';}
if (!process.env.LOGGER) {process.env.LOGGER = 'on';}

// connect to mongodb database
mongoose.connect(
    'mongodb://'+process.env.DB_CONNECTION+'/signal-noise',
    function(err) {
        if (err) {
            console.error(chalk.red.bold('could not connect to mongodb'));
            console.error(chalk.red(err));
            throw err;
        }
        console.log(chalk.green('connected to mongodb at '+process.env.DB_CONNECTION));

        // initialize express application
        var app = require('./server/express.js')(mongoose);

        // start http server
        http.createServer(app).listen(process.env.PORT, function() {
            console.log(chalk.green('application started on port '+process.env.PORT));
        });
    }
);