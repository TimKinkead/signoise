'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var fs = require('fs'),
    http = require('http'),
    https = require('https'),
    path = require('path'),                                     // resolve file paths
    express = require('express'),                               // express application
    morgan = require('morgan'),                                 // console logger (using in dev)
    bodyParser = require('body-parser'),                        // parse request body
    session = require('express-session'),                       // sessions
    compress = require('compression'),                          // gzip response data if browser is compatible
    methodOverride = require('method-override'),                // enables app.put & app.delete requests
    cookieParser = require('cookie-parser'),                    // parse session cookies
    helmet = require('helmet'),						            // security
    passport = require('passport'),                             // authentication
    mongoStore = require('connect-mongo')({session: session}),  // mongo specific sessions
    consolidate = require('consolidate');			            // template engine consolidation library

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

// use '_' to avoid scoping issues
var file = require('./modules/file');

//----------------------------------------------------------------------------------------------------------------------
// Initialize Application

module.exports = function(db) {

    // -- MODELS --

    // glob model files
    file.globber('server/models/*.js').forEach(function(modelPath) {
        require(path.resolve(modelPath));
    });

    // -- INITIALIZATION --

    // initialize express app
    var app = express();

    // -- COMPRESSION --

    // compress (gzip) response data if browser is compatible (before express.static)
    app.use(compress());

    // -- VIEWS --

    // set swig as the template engine
    app.engine('html', consolidate.swig);

    // set default view engine
    app.set('view engine', 'html');

    // views static directory & views cache
    var staticDirectory;
    switch (process.env.NODE_ENV) {
        case 'development':
            staticDirectory = './client';
            app.set('views', staticDirectory);
            app.set('view cache', false);
            break;
        case 'production':
            staticDirectory = './public';
            app.set('views', staticDirectory);
            app.locals.cache = 'memory';
            break;
    }

    // -- REQUEST, BODY, COOKIES --

    // body parsing middleware (before methodOverride)
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    // enable http method override for app.put & app.delete
    app.use(methodOverride());

    // cookie parsing middleware (before session)
    app.use(cookieParser());

    // -- SESSIONS --

    // express mongodb session storage
    app.use(session({
        saveUninitialized: true,
        resave: true,
        secret: 'keyboardcat',
        store: new mongoStore({
            db: db.connection.db,
            collection: 'sessions',
            autoReconnect: true
            //stringify: false
        }),
        name: 'signal-noise'
    }));

    // use passport
    require('./config/passport')();
    app.use(passport.initialize());
    app.use(passport.session());

    // -- SECURITY --

    // use helmet to secure express headers
    app.use(function(req, res, next) {
        helmet.xframe().apply({}, arguments);
    });
    app.use(helmet.xssFilter());
    app.use(helmet.nosniff());
    app.use(helmet.ienoopen());
    app.disable('x-powered-by');

    // -- LOGGING --

    // show stack errors
    app.set('showStackError', true);

    // enable logger
    if (process.env.LOGGER === 'on') {
        app.use(morgan('dev', {immediate: true}));  // log @ req
        app.use(morgan('dev'));                     // log @ res
    }

    // -- ROUTING --

    // glob routing files
    file.globber([
        'server/modules/**/routes.js',
        'server/modules/**/routes/*.js'
    ]).forEach(function(routePath) {
        require(path.resolve(routePath))(app);
    });

    // set app router & static folder
    // - permission checked in server/modules/core/routes.js
    app.use(express.static(path.resolve(staticDirectory)));

    // routing error
    var error = require('./modules/error'); // use '_' to avoid scoping issues
    app.use(function(req, res, next) {
        if (req.originalUrl.indexOf('accessconditions.com/data/') > 0) {
            error.log(new Error('routing error: "'+req.originalUrl+'" not found'));
            return res.sendStatus(404);
        }
        next();
    });

    // remove '/' from end of path
    app.use(function(req, res, next) {
        if (req.path.length > 1 && req.path.lastIndexOf('/') + 1  === req.path.length) {
            return res.redirect(req.path.substr(0, req.path.length - 1));
        }
        next();
    });

    // return index.html
    var core = require('./modules/core');
    app.use(core.index);

    // -- DONE --

    // return express server instance
    return app;
};
