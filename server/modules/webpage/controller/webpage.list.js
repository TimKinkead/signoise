'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    WebPage = mongoose.model('WebPage');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * PAGE.LIST
 * - List web pages.
 */
exports.list = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'List WebPages Error!',
            message: message || 'We had trouble listing webpages. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to list webpages.');}

    // mongodb query parameters
    var query, sort;
    switch (req.query.filterBy) {
        case 'pending':
        case 'fetched':
        case 'ignored':
        case 'redirected':
        case 'scheduled':
            query = {status: req.query.filterBy};
            sort = {created: -1};
            break;
        //case 'all':
        default:
            query = {};
            sort = {created: -1};
    }

    // list web pages
    WebPage.find(query)
        .sort(sort)
        .skip(Number(req.query.skip))
        .limit((req.query.limit) ? Number(req.query.limit) : 100)
        .exec(function(err, pageDocs) {
            if (err) {error.log(new Error(err)); return errorMessage();}

            // done
            logger.result('webpages listed');
            return res.status(200).send(pageDocs);
        });
};