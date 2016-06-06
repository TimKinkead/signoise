'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    Place = mongoose.model('Place'),
    SocialMedia = mongoose.model('SocialMedia');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error/index'),
    logger = require('../../logger/index');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var getTwitterTokenAndSecret = require('./twitter/socialmedia.twitter.token.secret.js').getTwitterTokenAndSecret,
    twitterApiGet = require('./twitter/socialmedia.twitter.api.get.js').twitterApiGet;

/**
 * Get location from places collection or twitter api geo search.
 * @param locationName - query string
 * @param clbk - return clbk(err, [lng, lat], apiRequest)
 */
function getLocation(locationName, clbk) {
    if (!locationName) { return clbk(null, null, false); }
    
    // look for existing place
    Place.find({names: locationName})
        .exec(function(err, placeDocs) {
            if (err) { return clbk(new Error(err), null, false); }
            if (placeDocs && placeDocs.length) {
                for (var i=0, x=placeDocs.length; i<x; i++) {
                    if (placeDocs[i] && placeDocs[i].location && placeDocs[i].data && ['city'].indexOf(placeDocs[i].data.place_type) > -1) {
                        return clbk(null, placeDocs[i].location, false);
                    }
                }
                if (!placeDocs[0].location || !placeDocs[0].location[0] || !placeDocs[0].location[1]) {
                    return clbk(null, null, false);
                }
                return clbk(null, placeDocs[0].location, false);
            }
            
            // get twitter token and secret
            getTwitterTokenAndSecret(function(err, token, secret) {
                if (err) { return clbk(err); } 
                if (!token) { return clbk(new Error('!token')); }
                if (!secret) { return clbk(new Error('!secret')); }

                // get location from twitter api geo search
                twitterApiGet(
                    'https://api.twitter.com/1.1/geo/search.json?query='+encodeURIComponent(locationName),
                    token,
                    secret,
                    function(err, data) {
                        if (err) { return clbk(err, null, true); }
                        if (!data || !data.result || !data.result.places || !data.result.places.length) { return clbk(null, null, true); }

                        // grab first place
                        var place = data.result.places[0];

                        // upsert place
                        Place.update(
                            {source: 'twitter', 'data.id': place.id},
                            {
                                $push: {names: locationName},
                                $set: {location: place.centroid, source: 'twitter', data: place, modified: new Date()},
                                $setOnInsert: {created: new Date()}
                            },
                            {upsert: true},
                            function(err) {
                                if (err) { return clbk(new Error(err), null, true); }

                                // return lng/lat
                                if (['city'].indexOf(place.place_type) > -1) {
                                    return clbk(null, place.centroid, true);
                                } else {
                                    return clbk(null, null, true);
                                }
                            }
                        );
                    }
                );
            });
        });
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.UPDATE.LOCATION
 * - Update location data for social media.
 * - Use the 'places' collection and twitter geo search api to get place.
 * - Run this once in a while.
 */
exports.updateLocations = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Update Social Media Locations Error!',
            message: message || 'We had trouble updating the social media locations. Please try again.'
        });
    }

    var twitterRequests = 0, 
        twitterRequestLimit = 15, // https://dev.twitter.com/rest/reference/get/geo/search
        stopTime = (function() { var d = new Date(); d.setMinutes(d.getMinutes()+15); return d; })();
    
    // get social media docs
    SocialMedia.find({
            locationChecked: {$exists: false},
            'data.user.location': {$exists: true}
        })
        .limit((req.query.limit) ? Number(req.query.limit) : 1000)
        .exec(function(err, mediaDocs) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!mediaDocs) { error.log(new Error('!mediaDocs')); return errorMessage(); }
            
            // respond to client
            res.status(200).send('Working on updating social media locations.');
            
            // process each social media doc
            var i = 0, now;
            function processMediaDoc() {
                
                function nextMediaDoc(delay) {
                    i++;
                    now = new Date();
                    if (i+1 >= mediaDocs.length) { logger.bold('done with social media location update'); return; }
                    if (now > stopTime) { logger.bold('stopping social media location update b/c hit stop time'); return; }
                    if (twitterRequests >= twitterRequestLimit) { logger.bold('stopping social media location update b/c hit request limit'); return; }
                    logger.log('location checked '+i+'/'+mediaDocs.length+' ('+Math.round((i/mediaDocs.length)*100)+'%)'+' '+twitterRequests+' twitter api requests');
                    if (delay) { setTimeout(function() { processMediaDoc(); }, 1000*60*delay); return; }
                    processMediaDoc();
                }

                // media doc
                var mediaDoc = mediaDocs[i];
                if (!mediaDoc) { nextMediaDoc(); return; }

                // get location
                getLocation(mediaDoc.data.user.location, function(err, lnglat, twApiReq) {
                    if (err) {
                        if (err.info && err.info.data && err.info.data.toLowerCase().indexOf('rate limit exceeded') > -1) {
                            nextMediaDoc(1); return;
                        } else { 
                            error.log(err); nextMediaDoc(1); return;
                        }
                    }
                    if (twApiReq) { twitterRequests++; }

                    // update media doc
                    if (lnglat) { mediaDoc.location = lnglat; }
                    mediaDoc.locationChecked = new Date();
                    mediaDoc.save(function(err) {
                        if (err) { error.log(new Error(err)); nextMediaDoc(1); return; }

                        // next
                        nextMediaDoc();
                    });
                });
            }
            
            // start process
            processMediaDoc();
        });
};