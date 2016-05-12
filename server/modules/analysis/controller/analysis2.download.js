'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    Analysis2 = mongoose.model('Analysis2');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

function csvEscape(str) {
    return '"' + String(str || '').replace(/\"/g, '""') + '"';
}

/**
 * Return csv string for headers or data depending on download type and social media doc.
 * @param headerOrData - 'header' or 'data'
 * @param doc - social media doc
 * @returns {*} - return csv string
 */
function getCsv(headerOrData, doc) {
    if (['header', 'data'].indexOf(headerOrData) < 0) { return ''; }
    if (!doc) { doc = {}; }

    var config = [
        {header: 'type',                data: doc.type},
        {header: 'minDate',             data: doc.minDate},
        {header: 'maxDate',             data: doc.maxDate},
        {header: 'channel',             data: doc.channel},
        {header: 'topic',               data: (doc.topic) ? doc.topic.name : ''},
        {header: 'state',               data: (doc.state) ? doc.state.abbv : ''},
        {header: 'county',              data: (doc.county) ? doc.county.name : ''},
        {header: 'district',            data: (doc.district) ? doc.district.name : ''},
        //{header: 'socialseed',          data: (doc.socialseed) ? doc.socialseed.title : ''},
        {header: 'twitterAccount',      data: (doc.twitterAccount) ? doc.twitterAccount : ((doc.socialseed) ? doc.socialseed.title : '')},
        //{header: 'networkType',         data: doc.networkType},
        {header: 'networkWeight',       data: doc.networkWeight},
        {header: 'rankWeight',          data: doc.rankWeight},
        {header: 'totalWeight',         data: doc.totalWeight},
        {header: 'totalCount',          data: doc.totalCount},
        {header: 'count',               data: doc.count},
        {header: 'frequency',           data: doc.frequency},
        {header: 'sentiment',           data: doc.sentiment},
        {header: 'weightedCount',       data: doc.weightedCount},
        {header: 'weightedFrequency',   data: doc.weightedFrequency},
        {header: 'weightedSentiment',   data: doc.weightedSentiment}
    ];
    
    return config.map(function(cV) { return cV[headerOrData]; }).map(csvEscape).join(',');
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * ANALYSIS2.DOWNLOAD
 * - Download analysis2 collection as csv file.
 */
exports.analysis2download = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Download Analysis Error!',
            message: message || 'We had trouble downloading the analysis data for you. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to download analysis data.');}
    
    // start stream
    var streamStarted = false;
    function startStream() {
        res.setHeader('Content-disposition', 'attachment; filename=\"analysis.csv\"');
        res.contentType('text/csv');
        res.write(getCsv('header') + '\n');
        streamStarted = true;
    }

    // stream analysis data
    Analysis2.find({})
        .populate('topic', 'name')
        .populate('state', 'name abbv')
        .populate('county', 'name')
        .populate('district', 'name')
        .populate('socialseed', 'platform title')
        .sort({channel: 1, 'county.name': 1})
        .stream()
        .on('data', function(analysisDoc) {
            if (!streamStarted) { startStream(); }
            res.write(getCsv('data', analysisDoc) + '\n');
        })
        .on('close', function() {
            res.end();
        })
        .on('error', function(err) {
            error.log(new Error(err)); return errorMessage();
        });
};