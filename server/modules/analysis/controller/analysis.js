'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var _ = require('lodash');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    Analysis = mongoose.model('Analysis');

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
 * ANALYSIS
 * - Perform analysis and return results.
 * - Just return recent analysis results if they exist.
 */
exports.go = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Analysis Error!',
            message: message || 'We had trouble performing the analysis. Please try again.'
        });
    }

    if (!req.query.minDate) { return errorMessage(400, 'Please select a start date for analysis.'); }
    if (!req.query.maxDate) { return errorMessage(400, 'Please select an end date for analysis.'); }
    if (!req.query.channel) { return errorMessage(400, 'Please select a channel for analysis.'); }
    
    // clean up min/max dates
    var minDate = new Date(req.query.minDate),
        minYear = minDate.getFullYear(),
        minMonth = minDate.getMonth(),
        minDay = minDate.getDate(),
        maxDate = new Date(req.query.maxDate),
        maxYear = maxDate.getFullYear(),
        maxMonth = maxDate.getMonth(),
        maxDay = maxDate.getDate();
    req.query.minDate = new Date(minYear, minMonth, minDay);
    req.query.maxDate = new Date(maxYear, maxMonth, maxDay);
    if (req.query.minDate >= req.query.maxDate) { return errorMessage(400, 'Please select an end date that is after your start date.'); }

    // initialize analysis
    var analysis = {
        minDate: req.query.minDate,
        maxDate: req.query.maxDate,
        channel: req.query.channel
    };
    if (req.query.topic) { analysis.topic = req.query.topic; }
    if (req.query.state) { analysis.state = req.query.state; }
    if (req.query.county) { analysis.county = req.query.county; }

    // save analysis & return
    function done() {
        if (!analysis.hasOwnProperty('count') || !analysis.sentiment || !analysis.ngrams) { return res.status(200).send(null); }
        Analysis.create(analysis, function(err, newAnalysisDoc) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!newAnalysisDoc) { error.log(new Error('!newAnalysisDoc')); return errorMessage(); }
            return res.status(200).send(newAnalysisDoc);
        });
    }
    
    // look for recent analysis
    Analysis.findOne({
            minDate: analysis.minDate,
            maxDate: analysis.maxDate,
            channel: analysis.channel,
            topic: (analysis.topic) ? analysis.topic : {$exists: false},
            state: (analysis.state) ? analysis.state : {$exists: false},
            county: (analysis.county) ? analysis.county : {$exists: false},
            created: {
                $gt: (process.env.SERVER === 'local' || req.query.new) ? new Date() :
                    (function() { var d = new Date(); d.setDate(d.getDate()-7); return d; })()
            }
        })
        .exec(function(err, analysisDoc) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (analysisDoc) { return res.status(200).send(analysisDoc); }
            delete analysis.created;

            // perform channel specific analysis
            switch (req.query.channel) {

                // -- SOCIAL MEDIA --

                case 'all social media':
                case 'district social media':
                case 'district related social media':
                case 'geographic social media':
                    analyzeSocialMedia(req.query, function(err, results) {
                        if (err) { error.log(err); errorMessage(); return; }
                        if (!results) { return res.status(200).send(null); }
                        analysis = _.extend(analysis, results);
                        done();
                    });
                    break;

                // -- ERROR --

                default:
                    error.log(new Error('channel "'+req.query.channel+'" not supported'));
                    return errorMessage(400, 'Please select a valid channel for sentiment analysis.');
            }
        });
};