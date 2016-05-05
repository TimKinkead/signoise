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
        maxDate = new Date(year, month, 1);

    // get channels
    var channels = require('../../channel/data/channels.js');
    if (req.query.channel) { channels = [req.query.channel]; }
    
    // get topics
    Topic.find(
        (req.query.topic) ? {$or: [/*{_id: req.query.topic},*/ {name: req.query.topic}]} : {},
        function(err, topicDocs) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!topicDocs) { error.log(new Error('!topicDocs')); return errorMessage(); }

            // get states
            State.find(
                (req.query.state) ? {$or: [/*{_id: req.query.state},*/ {name: req.query.state}, {abbv: req.query.state}]} : {name: 'california'},
                function(err, stateDocs) {
                    if (err) { error.log(new Error(err)); return errorMessage(); }
                    if (!stateDocs) { error.log(new Error('!stateDocs')); return errorMessage(); }

                    // get counties
                    County.find(
                        (req.query.county) ? {$or: [/*{_id: req.query.county},*/ {name: req.query.county}]} : {state: stateDocs[0]._id},
                        function(err, countyDocs) {
                            if (err) { error.log(new Error(err)); return errorMessage(); }
                            if (!countyDocs) { error.log(new Error('!countyDocs')); return errorMessage(); }

                            // cons truct queue
                            var queue = [];
                            channels.forEach(function(channel) {
                                queue.push({
                                    type: (month+1)+'/1/'+year+' annual',
                                    minDate: minDate,
                                    maxDate: maxDate,
                                    channel: channel
                                });
                                topicDocs.forEach(function(topicDoc) {
                                    queue.push({
                                        type: (month+1)+'/1/'+year+' annual',
                                        minDate: minDate,
                                        maxDate: maxDate,
                                        channel: channel,
                                        topic: topicDoc._id
                                    });
                                    stateDocs.forEach(function(stateDoc) {
                                        queue.push({
                                            type: (month+1)+'/1/'+year+' annual',
                                            minDate: minDate,
                                            maxDate: maxDate,
                                            channel: channel,
                                            topic: topicDoc._id,
                                            state: stateDoc._id
                                        });
                                    });
                                    countyDocs.forEach(function(countyDoc) {
                                        queue.push({
                                            type: (month+1)+'/1/'+year+' annual',
                                            minDate: minDate,
                                            maxDate: maxDate,
                                            channel: channel,
                                            topic: topicDoc._id,
                                            state: countyDoc.state,
                                            county: countyDoc._id
                                        });
                                    });
                                });
                            });
                            if (!queue.length) { error.log(new Error('!queue.length')); return errorMessage(); }

                            // respond to client
                            res.status(200).send(queue);
                            //res.status(200).send('Working on batch analysis for '+queue.length+' items in queue.');

                            // perform analysis for each item in queue
                            var i = 0;
                            function performAnalysis() {

                                function nextAnalysis(delay) {
                                    i++;
                                    if (i+1 >= queue.length) { logger.bold('done with batch analysis'); return; }
                                    if (i < 5 || i%25 === 0) { logger.bold('batch analysis '+i+'/'+queue.length+' ('+Math.round((i/queue.length)*100)+'%)'); }
                                    if (!queue[i]) { nextAnalysis(); return; }
                                    if (delay) { setTimeout(function() { performAnalysis(); }, 1000*60*delay); return; }
                                    performAnalysis();
                                }

                                var query = {
                                    minDate: queue[i].minDate,
                                    maxDate: queue[i].maxDate,
                                    channel: queue[i].channel,
                                    topic: (queue[i].topic) ? queue[i].topic : {$exists: false},
                                    state: (queue[i].state) ? queue[i].state : {$exists: false},
                                    county: (queue[i].county) ? queue[i].county : {$exists: false}
                                };

                                // save analysis (upsert)
                                function saveAnalysis(results) {
                                    Analysis.update(
                                        query,
                                        {
                                            $set: {
                                                type: queue[i].type,
                                                count: results.count,
                                                sentiment: results.sentiment,
                                                ngrams: results.ngrams,
                                                created: new Date()
                                            }
                                        },
                                        {upsert: true},
                                        function(err) {
                                            if (err) { error.log(new Error(err)); }
                                            nextAnalysis();
                                        }
                                    );
                                }

                                // check if analysis already exists
                                Analysis.findOne(query, function(err, analysisDoc) {
                                    if (err) { error.log(new Error(err)); nextAnalysis(1); return; }
                                    if (analysisDoc && !req.query.new) { nextAnalysis(); return; }

                                    // perform analysis
                                    switch(queue[i].channel) {
                                        case 'all social media':
                                        case 'district social media':
                                        case 'district related social media':
                                            analyzeSocialMedia(queue[i], function(err, results) {
                                                if (err) {
                                                    err.params = queue[i];
                                                    error.log(err);
                                                    nextAnalysis(1);
                                                    return;
                                                }
                                                if (!results) { nextAnalysis(); return; }
                                                saveAnalysis(results);
                                            });
                                            break;
                                        default:
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