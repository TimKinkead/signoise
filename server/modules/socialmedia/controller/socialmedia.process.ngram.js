'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url');

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

/**
 * Clean up text before ngram processing.
 * @param text - string
 */
function cleanupText(text) {
    if (!text || typeof text !== 'string') { return ''; }

    // strip retweet off front
    var regex1 = /(^RT|^\s+|^\@\S+)/;
    while (text.match(regex1)) {
        text = text.replace(regex1, ''); 
    }

    // strip link & hashtags off end

    // strip other

    // TODO: finish ngram processing
    
}

/**
 * Get 1-, 2-, 3-, and 4-gram data from ngram processing service.
 * @param text - social media text
 * @param clbk - return clbk(errs, ngrams)
 */
function getNgrams(text, clbk) {
    if (!text) { return clbk(); }

    var ngramService = 'http://52.37.246.19:8080/ngrams',
        ngrams = {},
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
                if (body) { ngrams[gramSize.toString()] = body; }
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
 * - Run every hour via a cron job.
 */
exports.processNgrams = function(req, res) {
    logger.filename(__filename);

    // respond to client
    logger.bold('working on ngram processing');
    res.status(200).send('working on ngram processing');

    var stopTime = (function() { var d = new Date(); d.setHours(d.getHours()+1); return d; })(),
        limit = 10;

    // get social media docs
    SocialMedia.find({'meta.ngramsProcessed': {$exists: false}})
        .sort({date: -1})
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

                function nextMediaDoc() {
                    mediaDocIndex++;
                    if (mediaDocs[mediaDocIndex] && now < stopTime) {
                        processMediaDoc();
                    } else {
                        logger.bold('done - ngrams processed for '+mediaDocIndex+' social media docs');
                    }
                }

                // get ngrams for social media text
                getNgrams(mediaDoc.text, function(errs, ngrams) {
                    if (errs) { errs.forEach(function(err) { error.log(err); }); }

                    // save media doc
                    mediaDoc.ngramsProcessed = new Date();
                    mediaDoc.ngrams = ngrams || {};
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