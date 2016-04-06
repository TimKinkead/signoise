
'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url'),
    _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var socialmedia = {};
socialmedia = _.extend(socialmedia, require('./twitter/socialmedia.twitter.clean.text.js'));
socialmedia = _.extend(socialmedia, require('./facebook/socialmedia.facebook.clean.text.js'));

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.PROCESS.SENTIMENT
 * - Perform sentiment processing on social media.
 * - Run every hour via a cron job.
 */
exports.processSentiment = function(req, res) {
    logger.filename(__filename);

    // respond to client
    logger.bold('working on sentiment processing');
    res.status(200).send('working on sentiment processing');

    var sentimentService = 'http://52.37.246.19:8080/sentiment',
        stopTime = (function() { var d = new Date(); d.setHours(d.getHours()+1); return d; })(),
        limit = 5000;

    // get social media docs
    SocialMedia.find({sentimentProcessed: {$exists: false}})
        .sort({date: -1})
        .limit(limit)
        .exec(function(err, mediaDocs) {
            if (err) { error.log(new Error(err)); return; }
            if (!mediaDocs) { error.log(new Error('!mediaDocs')); return; }
            if (!mediaDocs.length) { logger.result('no social media docs for sentiment processing right now'); return; }

            // process media docs
            var mediaDocIndex = 0;
            function processMediaDoc() {

                var mediaDoc = mediaDocs[mediaDocIndex],
                    now = new Date();

                function nextMediaDoc(delay) {
                    mediaDocIndex++;
                    if (mediaDocs[mediaDocIndex] && now < stopTime) {
                        if (delay) {
                            setTimeout(function() {processMediaDoc();}, 1000*60*delay);
                        } else {
                            processMediaDoc();   
                        }
                    } else {
                        logger.bold('done - sentiment processed for '+mediaDocIndex+' social media docs');
                    }
                }

                // clean up text
                if (mediaDoc.platform === 'facebook') {
                    mediaDoc.text = socialmedia.cleanFacebookText(mediaDoc.text);   
                } else if (mediaDoc.platform === 'twitter') {
                    mediaDoc.text = socialmedia.cleanTwitterText(mediaDoc.text);
                }
                
                // check text
                if (!mediaDoc.text) {
                    mediaDoc.sentimentProcessed = new Date();
                    mediaDoc.save(function(err) {
                        if (err) { error.log(new Error(err)); }
                        nextMediaDoc();
                    });
                    return;
                }
                
                // get sentiment for social media text from sentiment service
                request.post(
                    {
                        url: url.parse(sentimentService),
                        json: true,
                        body: {content: mediaDoc.text}
                    },
                    function(err, response, body) {
                        if (err) { error.log(new Error(err)); nextMediaDoc(1); return; }
                        if (!body) { error.log(new Error('!body')); nextMediaDoc(1); return; }
                        if (!body.sentiment) { error.log(new Error('!body.sentiment')); nextMediaDoc(1); return; }
                        if (!body.probability) { error.log(new Error('!body.probability')); nextMediaDoc(1); return; }
                        
                        // save media doc
                        mediaDoc.sentimentProcessed = new Date();
                        mediaDoc.sentiment = body.sentiment;
                        mediaDoc.probability = body.probability;
                        mediaDoc.save(function(err) {
                            if (err) { error.log(new Error(err)); }
                            nextMediaDoc();
                        });      
                    }
                );
            }

            // start
            processMediaDoc();
        });
};