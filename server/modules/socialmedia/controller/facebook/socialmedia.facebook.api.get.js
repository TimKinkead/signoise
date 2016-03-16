'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logger = require('../../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.FACEBOOK.API.GET
 * - Perform a get request at a facebook graph api endpoint.
 * @param fbUrl - facebook graph api request url
 * @param clbk - return clbk(err, data)
 */
exports.facebookApiGet = function(fbUrl, clbk) {
    logger.filename(__filename);

    if (!fbUrl) {return clbk(new Error('!fbUrl'));}

    // get facebook info
    request.get(
        {url: url.parse(fbUrl), json: true},
        function(err, response, body) {
            if (err) {return clbk(new Error(err));}
            if (!body) {return clbk(new Error('!body'));}
            return clbk(null, body);
        }
    );
};