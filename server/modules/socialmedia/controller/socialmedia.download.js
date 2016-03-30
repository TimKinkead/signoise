'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var fs = require('fs'),
    es = require('event-stream'),
    Json2csvStream = require('json2csv-stream');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    Districts = mongoose.model('District');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

function csvEscape(str) {
    return '"' + String(str || '').replace(/\"/g, '""') + '"';
}

function getHeaders(districtQuery) {
    return [
        
        // general
        '_id',
        'platform',
        'date',
        'text',
        
        // seed
        'seed._id',
        'seed.title',
        
        // district
        'district._id',
        'district.name',
        'district.city',
        'district.county',
        'district.state',

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

function docToCSV(doc, districtQuery) {

    var district = (doc.district) ? doc.district : {},
        seed = (doc.socialseed) ? doc.socialseed : {},
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

        // district
        district._id,
        district.name,
        district.city,
        district.county,
        district.state,

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

/**
 * Get districts for a given state.
 * @param state - state code
 * @param clbk - return clbk(err, districts)
 */
function getDistricts(state, clbk) {
    if (!state) { return clbk(); }
    
    Districts.find({state: state}, function(err, districtDocs) {
        if (err) { return clbk(new Error(err)); }
        if (!districtDocs) { return clbk(new Error('!districtDocs')); }
        
        return clbk(null, districtDocs);
    });
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
    var districtQuery = (req.query.state),
        d = new Date(),
        year = d.getFullYear(),
        month = d.getMonth()+1,
        day = d.getDate();
    if (month < 10) {month = '0'+month;}
    if (day < 10) {day = '0'+day;}

    // start stream
    var streamStarted = false;
    function startStream() {
        logger.result('startStream');
        res.setHeader('Content-disposition', 'attachment; filename=\"socialmedia_'+year+'-'+month+'-'+day+'.csv\"');
        res.contentType('text/csv');
        res.write(getHeaders(districtQuery) + '\n');
        streamStarted = true;
    }

    // get districts
    logger.result('getDistricts');
    getDistricts(req.query.state, function(err, districts) {
        if (err) { error.log(err); return errorMessage(); }
        if (districtQuery && !districts) { error.log('districtQuery && !districts'); return errorMessage(); }

        function lookupDistrict(seedId) {
            if (!districts || !seedId) { return null; }
            for (var i=0, x=districts.length; i<x; i++) {
                if (districts[i].facebookSeed && districts[i].facebookSeed.toString() === seedId.toString()) { return districts[i]; }
                if (districts[i].twitterSeed && districts[i].twitterSeed.toString() === seedId.toString()) { return districts[i]; }
            }
            return null;
        }
        
        // build query
        logger.result('buildQuery');
        var query = {};
        if (districtQuery) {
            var districtSeedIds = [];
            districts.forEach(function(cV) {
                if (cV.facebookSeed) { districtSeedIds.push(cV.facebookSeed); }
                if (cV.twitterSeed) { districtSeedIds.push(cV.twitterSeed); }
            });
            query.socialseed = {$in: districtSeedIds};
            logger.log('districtIds.length = '+districtSeedIds.length);
        }
        if (req.query.minDate || req.query.maxDate) {
            query.date = {};
            if (req.query.minDate) {query.date.$gt = req.query.minDate;}
            if (req.query.maxDate) {query.date.$lt = req.query.maxDate;}
        }
        //logger.log(query);

        // count docs to check
        SocialMedia.count(query, function(err, qty) {
            if (err) {console.log(err);}
            console.log('qty = '+qty);
        });
        
        // stream social media docs
        logger.result('streaming');
        SocialMedia.find(query)
            .sort({date: -1})
            .skip((req.query.skip) ? Number(req.query.skip) : 0)
            .limit((req.query.limit) ? Number(req.query.limit) : null)
            .populate('socialseed', 'title')
            .stream()
            .on('data', function(mediaDoc) {
                if (!streamStarted) {startStream();}
                if (districtQuery && mediaDoc.socialseed._id) {
                    mediaDoc.district = lookupDistrict(mediaDoc.socialseed._id);
                }
                if (mediaDoc.district) {logger.log('district!!!');}
                logger.result('data');
                res.write(docToCSV(mediaDoc, districtQuery) + '\n');
            })
            .on('close', function() {
                res.end();
            })
            .on('error', function(err) {
                error.log(new Error(err));
                return errorMessage();
            });
    });
};