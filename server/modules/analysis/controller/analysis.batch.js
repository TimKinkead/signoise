'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    Analysis = mongoose.model('Analysis'),
    Topic = mongoose.model('Topic'),
    State = mongoose.model('State'),
    County = mongoose.model('County');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var analyzeSocialMedia = require('./analysis.socialmedia').analyzeSocialMedia;

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * ANALYSIS.BATCH
 * - Run analysis for all topic/channel/state/county combinations for past year.
 */
exports.batch = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Batch Analysis Error!',
            message: message || 'We had trouble performing the analysis. Please try again.'
        });
    }
    
    var d = new Date(),
        month = d.getMonth(),
        year = d.getFullYear(),
        minDate = new Date(year-1, month, 1),
        maxDate = new Date(year, month, 1),

        socialmediaChannels = ['all social media', 'district social media', 'district related social media'];
    
    // get topics
    Topic.find(
        (req.query.topic) ? {_id: req.query.topic} : {},
        function(err, topicDocs) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!topicDocs) { error.log(new Error('!topicDocs')); return errorMessage(); }

            // get all channels
            var channels = require('../../channel/data/channels.js');
            if (req.query.channel) { channels = [req.query.channel]; }

            // get all states
            State.find(
                (req.query.state) ? {_id: req.query.state} : {name: 'california'},
                function(err, stateDocs) {
                    if (err) { error.log(new Error(err)); return errorMessage(); }
                    if (!stateDocs) { error.log(new Error('!stateDocs')); return errorMessage(); }

                    // get all counties
                    County.find(
                        (req.query.county) ? {_id: req.query.county} : {},
                        function(err, countyDocs) {
                            if (err) { error.log(new Error(err)); return errorMessage(); }
                            if (!countyDocs) { error.log(new Error('!countyDocs')); return errorMessage(); }

                            // construct queue
                            var queue = [];
                            topicDocs.forEach(function(topicDoc) {
                                channels.forEach(function(channel) {
                                    queue.push({
                                        type: (month+1)+'/1/'+year+' annual',
                                        topic: topicDoc._id,
                                        channel: channel,
                                        minDate: minDate,
                                        maxDate: maxDate
                                    });
                                    stateDocs.forEach(function(stateDoc) {
                                        queue.push({
                                            type: (month+1)+'/1/'+year+' annual',
                                            topic: topicDoc._id,
                                            channel: channel,
                                            minDate: minDate,
                                            maxDate: maxDate,
                                            state: stateDoc._id
                                        });
                                    });
                                    countyDocs.forEach(function(countyDoc) {
                                        queue.push({
                                            type: (month+1)+'/1/'+year+' annual',
                                            topic: topicDoc._id,
                                            channel: channel,
                                            minDate: minDate,
                                            maxDate: maxDate,
                                            state: countyDoc.state,
                                            county: countyDoc._id
                                        });
                                    });
                                });
                            });
                            if (!queue.length) { error.log(new Error('!queue.length')); return errorMessage(); }

                            // respond to client
                            res.status(200).send('Working on batch analysis for '+queue.length+' items in queue.');

                            // perform analysis for each item in queue
                            var i = 0;
                            function performAnalysis() {

                                function nextAnalysis(delay) {
                                    i++;
                                    if (i+1 >= queue.length) { logger.bold('done with batch analysis'); return; }
                                    if (i%25 === 0) { logger.log(i+'/'+queue.length+' ('+Math.round((i/queue.length)*100)+'%)'); }
                                    if (!queue[i]) { nextAnalysis(); return; }
                                    if (delay) { setTimeout(function() { performAnalysis(); }, 1000*60*delay); return; }
                                    performAnalysis();
                                }

                                var qType = queue[i].type;
                                delete queue[i].type;

                                // save analysis
                                function saveAnalysis(results) {
                                    Analysis.update(
                                        queue[i],
                                        {
                                            $set: {
                                                type: qType,
                                                count: results.count,
                                                sentiment: results.sentiment,
                                                ngrams: results.ngrams,
                                                modified: new Date()
                                            },
                                            $setOnInsert: {created: new Date()}
                                        },
                                        {upsert: true},
                                        function(err) {
                                            if (err) { error.log(new Error(err)); }
                                            nextAnalysis();
                                        }
                                    );
                                }

                                // check if analysis already exists
                                Analysis.findOne(queue[i], function(err, analysisDoc) {
                                    if (err) { error.log(new Error(err)); nextAnalysis(1); return; }
                                    if (analysisDoc) { saveAnalysis(analysisDoc); nextAnalysis(); return; }

                                    // perform social media analysis
                                    if (socialmediaChannels.indexOf(queue[i].channel) > -1) {
                                        analyzeSocialMedia(queue[i], function (err, results) {
                                            if (err) {
                                                err.params = queue[i];
                                                error.log(err);
                                                nextAnalysis(1);
                                                return;
                                            }
                                            if (!results) { nextAnalysis(); return; }
                                            saveAnalysis(results);
                                        });
                                    }

                                    // perform other analysis
                                    else {
                                        nextAnalysis();
                                    }
                                });
                            }

                            // start analysis
                            performAnalysis();
                        }
                    );
                }
            );
        }
    );
};