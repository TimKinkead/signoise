'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    Analysis = mongoose.model('Analysis'),
    Topic = mongoose.model('Topic'),
    District = mongoose.model('District');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

var util = {};
util = _.extend(util, require('../util/analysis.util.socialmedia')); // analyzeSocialMedia

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * ANALYSIS.ALL.COUNTIES.ANNUAL
 * - Run analysis for all counties for last 1 year period.
 */
exports.allCountiesAnnual = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'All Counties Annual Analysis Error!',
            message: message || 'We had trouble performing the analysis. Please try again.'
        });
    }
    
    var d = new Date(),
        month = d.getMonth(),
        year = d.getFullYear(),
        minDate = new Date(year-1, month, 1),
        maxDate = new Date(year, month, 1);
    
    // get all topics
    Topic.find()
        .exec(function(err, topicDocs) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!topicDocs) { error.log(new Error('!topicDocs')); return errorMessage(); }

            // get all channels
            var channels = require('../../channel/data/channels.js');

            // just social media channels right now
            channels = ['all social media', 'district social media', 'district related social media'];

            // get all counties
            District.aggregate([
                    {$group: {_id: {state: '$state', county: '$county'}}},
                    {$project: {name: '$_id.county', state: '$_id.state'}}
                ])
                .exec(function(err, countyDocs) {
                    if (err) { error.log(new Error(err)); return errorMessage(); }
                    if (!countyDocs) { error.log(new Error('!countyDocs')); return errorMessage(); }

                    // construct queue
                    var queue = [];
                    topicDocs.forEach(function(topicDoc) {
                        channels.forEach(function(channel) {
                            countyDocs.forEach(function(countyDoc) {
                                queue.push({
                                    type: 'county-annual',
                                    topic: topicDoc._id,
                                    minDate: minDate,
                                    maxDate: maxDate,
                                    channel: channel,
                                    state: countyDoc.state,
                                    county: countyDoc.name
                                });
                            });
                        });
                    });
                    if (!queue.length) { error.log(new Error('!queue.length')); return errorMessage(); }
                    
                    // respond to client
                    res.status(200).send('Working on "all-counties-annual" analysis.');
                    
                    // perform analysis for each item in queue
                    var i = 0;
                    function performAnalysis() {
                        
                        function nextAnalysis(delay) {
                            i++;
                            if (!queue[i]) { logger.bold('done with "all-counties-annual" analysis'); return; }
                            if (delay) { setTimeout(function() { performAnalysis(); }, 1000*60*delay); }
                            else { performAnalysis(); }
                        }
                        
                        // perform analysis
                        util.analyzeSocialMedia(queue[i], function(err, results) {
                            if (err) {
                                err.params = queue[i];
                                error.log(err);
                                nextAnalysis(1);
                                return;
                            }
                            if (!results) { nextAnalysis(); return; }
                            
                            // save analysis (upsert)
                            Analysis.update(
                                queue[i], // type, topic, minDate, maxDate, channel, state, county
                                {
                                    $set: {
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
                        });
                    }
                    
                    // start analysis
                    performAnalysis();
                }
            );
        });
};