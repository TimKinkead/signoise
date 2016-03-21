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
        
        // general
        '_id',
        'platform',
        'date',
        'text',
        
        // seed
        'seed._id',
        'seed.title',

        // twitter tweet
        'tw.id',
        'tw.text',
        'tw.retweet_cnt',
        'tw.favorite_cnt',
        'tw.created_at',

        // twitter user
        'tw.user.id',
        'tw.user.screen_name',
        'tw.user.name',
        'tw.user.description',
        'tw.user.location',
        'tw.user.url',
        'tw.user.followers_count',
        'tw.user.friends_count',
        'tw.user.statuses_count',
        'tw.user.profile_image_url',
        'tw.user.created_at',

        // facebook post
        'fb.id',
        'fb.type',
        'fb.message',
        //'fb.likes',
        //'fb.comments',
        //'fb.attachments',
        'fb.created_time',
        
        // facebook user
        'fb.from.id',
        'fb.from.name',
        'fb.from.picture.data.url',
        
        // processing
        'status',
        'processed',
        
        // timestamps
        'modified',
        'created'
    ].map(csvEscape).join(',');
}

function docToCSV(doc) {

    var seed = (doc.socialseed) ? doc.socialseed : {},
        tweet = (doc.platform === 'twitter' && doc.data) ? doc.data : {},
        twUser = (doc.platform === 'twitter' && doc.data && doc.data.user) ? doc.data.user : {},
        fbPost = (doc.platform === 'facebook' && doc.data) ? doc.data : {},
        fbUser = (doc.platform === 'facebook' && doc.data && doc.data.from) ? doc.data.from : {};

    return [
        // general
        doc._id,
        doc.platform,
        doc.date,
        doc.text,
        
        // seed
        seed._id,
        seed.title,

        // tweet
        tweet.id,
        tweet.text,
        tweet.retweet_count,
        tweet.favorite_count,
        tweet.created_at,

        // twitter user
        twUser.id,
        twUser.screen_name,
        twUser.name,
        twUser.description,
        twUser.location,
        twUser.url,
        twUser.followers_count,
        twUser.friends_count,
        twUser.statuses_count,
        twUser.profile_image_url,
        twUser.created_at,

        // facebook post
        fbPost.id,
        fbPost.type,
        fbPost.message,
        //fbPost.likes...
        //fbPost.comments...
        //fbPost.attachments...
        fbPost.created_time,

        // facebook user
        fbUser.id,
        fbUser.name,
        (fbUser.picture && fbUser.picture.data) ? fbUser.picture.data.url : '',
        
        // processing
        doc.status,
        doc.processed,
        
        // timestamps
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
        .sort({date: -1})
        .skip((req.query.skip) ? Number(req.query.skip) : 0)
        .limit((req.query.limit) ? Number(req.query.limit) : 5000)
        .populate('socialseed', 'title')
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