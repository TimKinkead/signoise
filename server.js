'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var http = require('http'),
    mongoose = require('mongoose'),
	chalk = require('chalk');

//----------------------------------------------------------------------------------------------------------------------
// Environment Variables

console.log(chalk.blue.bold('\nENVIRONMENT VARIABLES'));
[
    {var: 'NODE_ENV', default: 'development'},
    {var: 'SERVER', default: 'local'},
    {var: 'PORT', default: '3000'},
    {var: 'DB_CONNECTION', default: 'localhost'},
    {var: 'LOGGER', default: 'on'}
].forEach(function(env) {
    if (!process.env[env.var]) {process.env[env.var] = env.default;}
    console.log(chalk.blue(env.var+'='+process.env[env.var]));
});

//----------------------------------------------------------------------------------------------------------------------
// Start Server

console.log(chalk.green.bold('\nSTARTING SERVER'));

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