'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var http = require('http'),
    mongoose = require('mongoose'),
    chalk = require('chalk');

//----------------------------------------------------------------------------------------------------------------------
// Variables

var initialConnection = true,
    connected = false,
    reconnectTries = 30,
    reconnectInterval = 1000;

//----------------------------------------------------------------------------------------------------------------------
// Start Server

function startServer() {

    console.log(chalk.green.bold('\nSTARTING SERVER'));

    // initialize express application
    var app = require('./server/express.js')(mongoose);

    // start http server
    http.createServer(app).listen(process.env.PORT, function() {
        console.log(chalk.green(' application started on port '+process.env.PORT));
    });

}

//----------------------------------------------------------------------------------------------------------------------
// Stop Server

function stopServer() {

    console.log(chalk.red.bold('\nSTOPPING SERVER'));
    console.error(chalk.red(' '+new Date()));

    if (connected) {
        mongoose.connection.close(function () {
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
}

process.on('SIGINT', stopServer);

//----------------------------------------------------------------------------------------------------------------------
// Timestamp

console.log(chalk.bold('\n********************'));
console.log(chalk.bold('\nSTARTING APPLICATION'));
console.log(' '+new Date());

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
    console.log(chalk.blue(' '+env.var+'='+process.env[env.var]));
});

//----------------------------------------------------------------------------------------------------------------------
// Database Connection
// - http://mongoosejs.com/docs/connections.html
// - http://theholmesoffice.com/mongoose-connection-best-practice/

console.log(chalk.cyan.bold('\nCONNECTING DATABASE'));

// create connection
mongoose.connect(
    'mongodb://'+process.env.DB_CONNECTION+'/signal-noise',
    {
        server: {
            auto_reconnect: true,
            reconnectTries: reconnectTries,
            reconnectInterval: reconnectInterval
        }
    }
);

// success
mongoose.connection.on('connected', function() {
    if (initialConnection) {
        console.log(chalk.cyan(' connected to mongodb at ' + process.env.DB_CONNECTION));
        initialConnection = false;
        connected = true;
        startServer();
    } else {
        console.log(chalk.cyan.bold('\nRECONNECTING DATABASE'));
        console.log(chalk.cyan(' connected to mongodb at ' + process.env.DB_CONNECTION));
        console.log(chalk.cyan(' '+new Date()));
        connected = true;
    }
});

// error
mongoose.connection.on('error',function (err) {
    console.error(chalk.red.bold('\nERROR: Could not connect to MongoDB.'));
    console.error(chalk.red(' '+err));
    console.error(chalk.red(' '+new Date()));
    stopServer();
});

// disconnected
mongoose.connection.on('disconnected', function () {
    console.error(chalk.red.bold('\nMONGODB DISCONNECTED'));
    console.error(chalk.red(' '+new Date()));
    connected = false;
    setTimeout(
        function() { if (!connected) { stopServer(); } }, 
        reconnectTries*reconnectInterval
    );
});