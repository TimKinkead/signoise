'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var fs = require('fs'),
    es = require('event-stream'),
    Json2csvStream = require('json2csv-stream');

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

function csvEscape(str) {
    return '"' + String(str || '').replace(/\"/g, '""') + '"';
}

function getHeaders() {
    return [
        '_id',
        'platform',

        'tweet id',
        'tweet text',
        'tweet retweet_cnt',
        'tweet favorite_cnt',
        'tweet created_at',

        'user id',
        'user screen_name',
        'user name',
        'user description',
        'user location',
        'user url',
        'user followers_count',
        'user friends_count',
        'user statuses_count',
        'user profile_image_url',
        'user created_at',

        'status',
        'modified',
        'created'
    ].map(csvEscape).join(',');
}

function docToCSV(doc) {

    var tweet = (doc.data) ? doc.data : {},
        user = (doc.data && doc.data.user) ? doc.data.user : {};

    return [
        doc._id,
        doc.platform,

        tweet.id,
        tweet.text,
        tweet.retweet_count,
        tweet.favorite_count,
        tweet.created_at,

        user.id,
        user.screen_name,
        user.name,
        user.description,
        user.location,
        user.url,
        user.followers_count,
        user.friends_count,
        user.statuses_count,
        user.profile_image_url,
        user.created_at,

        doc.status,
        doc.modified,
        doc.created
    ].map(csvEscape).join(',');
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.DOWNLOAD
 * - Download social media data as csv file.
 */
exports.download = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Download Social Media Error!',
            message: message || 'We had trouble downloading the social media data for you. Please try again.'
        });
    }

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to list social media.');}

    // variables
    var d = new Date(),
        year = d.getFullYear(),
        month = d.getMonth()+1,
        day = d.getDate();
    if (month < 10) {month = '0'+month;}
    if (day < 10) {day = '0'+day;}

    // start stream
    var streamStarted = false;
    function startStream() {
        res.setHeader('Content-disposition', 'attachment; filename=\"socialmedia_'+year+'-'+month+'-'+day+'.csv\"');
        res.contentType('text/csv');
        res.write(getHeaders() + '\n');
        streamStarted = true;
    }

    // stream social media docs
    SocialMedia.find()
        .stream()
        .on('data', function(mediaDoc) {
            if (!streamStarted) {startStream();}
            res.write(docToCSV(mediaDoc) + '\n');
        })
        .on('close', function() {
            res.end();
        })
        .on('error', function(err) {
            error.log(new Error(err));
            return errorMessage();
        });

};