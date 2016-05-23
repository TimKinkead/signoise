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

/**
 * Get 1-, 2-, 3-, and 4-gram data from ngram processing service.
 * @param text - social media text
 * @param clbk - return clbk(errs, ngrams)
 */
function getNgrams(text, clbk) {
    if (!text) { return clbk(); }

    var ngramService = 'http://52.37.246.19:8080/ngrams',
        ngrams = {all: []},
        errs = [],
        cnt;

    // check done
    function checkDone() {
        cnt -= 1;
        if (cnt === 0) {
            if (!errs.length) { errs = null; }
            return clbk(errs, ngrams);
        }
    }

    function runNgram(gramSize, truncateSize) {
        request.post(
            {
                url: url.parse(ngramService),
                json: true,
                body: {
                    content: text,
                    gramSize: gramSize,
                    truncateSize: truncateSize
                }
            },
            function(err, response, body) {
                if (err) { errs.push(new Error(err)); }
                if (body) { 
                    ngrams[gramSize.toString()] = body;
                    if (body.sorted && body.sorted.length) {
                        body.sorted.forEach(function(cV) {
                            if (cV.word && cV.count && body.gramSize && body.gramCount && body.wordCount) {
                                ngrams.all.push({
                                    word: cV.word,
                                    count: cV.count,
                                    gramSize: body.gramSize,
                                    gramCount: body.gramCount,
                                    wordCount: body.wordCount
                                });
                            } 
                        });
                    }
                }
                checkDone();
            }
        );
    }

    // start
    cnt = 4;
    runNgram(1, 0);
    runNgram(2, 0);
    runNgram(3, 0);
    runNgram(4, 0);
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.PROCESS.NGRAM
 * - Perform ngram processing on social media.
 * - Run every 15mins via a cron job.
 */
exports.processNgrams = function(req, res) {
    logger.filename(__filename);

    // respond to client
    logger.bold('Working on ngram processing.');
    res.status(200).send('Working on ngram processing.');

    var stopTime = (function() { var d = new Date(); d.setMinutes(d.getMinutes()+15); return d; })(),
        limit = (process.env.SERVER === 'local') ? 100000 : 1000;

    // get social media docs
    SocialMedia.find({ngramsProcessed: {$exists: false}})
        .limit(limit)
        .exec(function(err, mediaDocs) {
            if (err) { error.log(new Error(err)); return; }
            if (!mediaDocs) { error.log(new Error('!mediaDocs')); return; }
            if (!mediaDocs.length) { logger.result('no social media docs for ngram processing right now'); return; }

            // process media docs
            var mediaDocIndex = 0;
            function processMediaDoc() {

                var mediaDoc = mediaDocs[mediaDocIndex],
                    now = new Date();

                function nextMediaDoc(delay) {
                    mediaDocIndex++;
                    if (mediaDocIndex % 25 === 0) { logger.log(mediaDocIndex+'/'+mediaDocs.length+' ('+Math.round((mediaDocIndex/mediaDocs.length)*100)+'%)'); }
                    if (mediaDocIndex+1 >= mediaDocs.length) { logger.bold('Done! Ngrams processed for '+mediaDocs.length+' social media docs.'); return; }
                    if (now > stopTime) { logger.bold('Stopping because now > stopTime.'); return; }
                    if (!mediaDocs[mediaDocIndex]) { nextMediaDoc(); }
                    if (delay) { setTimeout(function() {processMediaDoc();}, 1000*60*delay); return;}
                    processMediaDoc();
                }

                // clean up text
                if (mediaDoc.platform === 'facebook') {
                    mediaDoc.text = socialmedia.cleanFacebookText(mediaDoc.text);
                } else if (mediaDoc.platform === 'twitter') {
                    mediaDoc.text = socialmedia.cleanTwitterText(mediaDoc.text);
                }

                // check text
                if (!mediaDoc.text) {
                    mediaDoc.ngramsProcessed = new Date();
                    mediaDoc.save(function(err) {
                        if (err) { error.log(new Error(err)); }
                        nextMediaDoc();
                    });
                    return;
                }
                
                // get ngrams for social media text
                getNgrams(mediaDoc.text, function(errs, ngrams) {
                    if (errs) { 
                        errs.forEach(function(err) { error.log(err); }); 
                        nextMediaDoc(1);
                        return;
                    }
                    if (!ngrams) {
                        error.log(_.extend(new Error('!ngrams'), {mediaDocId: mediaDoc._id}));
                        nextMediaDoc(1); 
                        return; 
                    }

                    // save media doc
                    mediaDoc.ngramsProcessed = new Date();
                    mediaDoc.ngrams = ngrams;
                    mediaDoc.save(function(err) {
                        if (err) { error.log(new Error(err)); }
                        nextMediaDoc();
                    });
                });
            }

            // start
            processMediaDoc();
        });
};