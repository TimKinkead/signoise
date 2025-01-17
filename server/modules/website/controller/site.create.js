'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    WebSite = mongoose.model('WebSite');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error');

//----------------------------------------------------------------------------------------------------------------------
// Methods

exports.create = function(req, res) {
    console.log(__filename);

    // url validation
    var patt = /^(https?|ftp):\/\/[\S]+\.[a-zA-Z]+\/?[\S]*$/;
    if (!req.body.url || !patt.test(req.body.url)) {
        return res.status(500).send({
            header: 'Create WebSite Error!',
            message: 'Please provide a valid url to create a new website.'
        });
    }

    // TODO: check if WebSite Doc already exists, if not create it

    // init mongoose model
    var site = new WebSite({});



};