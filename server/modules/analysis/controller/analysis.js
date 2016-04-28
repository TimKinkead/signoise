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

var util = {};
util = _.extend(util, require('../util/analysis.util.socialmedia')); // analyzeSocialMedia

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

    if (!req.query.topic) { return errorMessage(400, 'Please select a topic for analysis.'); }
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
    
    var analysis = {
        topic: req.query.topic,
        minDate: req.query.minDate,
        maxDate: req.query.maxDate,
        channel: req.query.channel,
        state: req.query.state,
        county: req.query.county
    };

    // save analysis & return
    function done() {
        if (!analysis.ngrams || !analysis.sentiment) { return res.status(200).send(null); }
        Analysis.create(analysis, function(err, newAnalysisDoc) {
            if (err) { error.log(new Error(err)); return errorMessage(); }
            if (!newAnalysisDoc) { error.log(new Error('!newAnalysisDoc')); return errorMessage(); }
            return res.status(200).send(newAnalysisDoc);
        });
    }
    
    // look for recent analysis
    var recentAnalysisDate = (process.env.SERVER === 'local' || req.query.new) ? new Date() : 
        (function() { var d = new Date(); d.setDate(d.getDate()-7); return d; })();
    analysis.created = {$gt: recentAnalysisDate};
    Analysis.findOne(analysis, function(err, analysisDoc) {
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
                util.analyzeSocialMedia(req.query, function(err, results) {
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