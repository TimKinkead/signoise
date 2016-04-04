'use strict';

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

/**
 * Return csv string for headers or data depending on download type and social media doc.
 * @param downloadType - req.query.type
 * @param headerOrData - 'header' or 'data'
 * @param delimiter - field delimiter character
 * @param doc - social media doc
 * @returns {*} - return csv string
 */
function getCsv(downloadType, headerOrData, delimiter, doc) {
    if (['districts-by-state', 'skip-limit'].indexOf(downloadType) < 0) { return ''; }
    if (['header', 'data'].indexOf(headerOrData) < 0) { return ''; }
    if (!delimiter) { delimiter = ','; }
    if (!doc) { doc = {}; }

    var district = (doc.district) ? doc.district : {},
        seed = (doc.socialseed) ? doc.socialseed : {},
        tweet = (doc.platform === 'twitter' && doc.data) ? doc.data : {},
        twUser = (doc.platform === 'twitter' && doc.data && doc.data.user) ? doc.data.user : {},
        fbPost = (doc.platform === 'facebook' && doc.data) ? doc.data : {},
        fbUser = (doc.platform === 'facebook' && doc.data && doc.data.from) ? doc.data.from : {},

        config = {
            general: [
                {header: '_id',         data: doc._id},
                {header: 'platform',    data: doc.platform},
                {header: 'date',        data: doc.date},
                {header: 'text',        data: doc.text}
            ],
            seed: [
                {header: 'seed._id',    data: seed._id},
                {header: 'seed.title',  data: seed.title}
            ],
            district: [
                {header: 'district._id',    data: district._id},
                {header: 'district.name',   data: district.name},
                {header: 'district.city',   data: district.city},
                {header: 'district.county', data: district.county},
                {header: 'district.state',  data: district.state}
            ],
            twitterTweet: [
                {header: 'tw.id',           data: tweet.id},
                {header: 'tw.text',         data: tweet.text},
                {header: 'tw.retweet_cnt',  data: tweet.retweet_count},
                {header: 'tw.favorite_cnt', data: tweet.favorite_count},
                {header: 'tw.created_at',   data: tweet.created_at}
            ],
            twitterLocation: [
                {header: 'tw.place',        data: (tweet.place && tweet.place.full_name) ? tweet.place.full_name : ''},
                {header: 'tw.country',      data: (tweet.place && tweet.place.country_code) ? tweet.place.country_code : ''},
                {header: 'tw.latitude',     data: (tweet.coordinates && tweet.coordinates.coordinates && tweet.coordinates.coordinates[1]) ? tweet.coordinates.coordinates[1] : ''},
                {header: 'tw.longitude',    data: (tweet.coordinates && tweet.coordinates.coordinates && tweet.coordinates.coordinates[0]) ? tweet.coordinates.coordinates[0] : ''}
            ],
            twitterUser: [
                {header: 'tw.user.id',                  data: twUser.id},
                {header: 'tw.user.screen_name',         data: twUser.screen_name},
                {header: 'tw.user.name',                data: twUser.name},
                {header: 'tw.user.description',         data: twUser.description},
                {header: 'tw.user.location',            data: twUser.location},
                {header: 'tw.user.url',                 data: twUser.url},
                {header: 'tw.user.followers_count',     data: twUser.followers_count},
                {header: 'tw.user.friends_count',       data: twUser.friends_count},
                {header: 'tw.user.statuses_count',      data: twUser.statuses_count},
                {header: 'tw.user.profile_image_url',   data: twUser.profile_image_url},
                {header: 'tw.user.created_at',          data: twUser.created_at}
            ],
            facebookPost: [
                {header: 'fb.id',               data: fbPost.id},
                {header: 'fb.type',             data: fbPost.type},
                {header: 'fb.message',          data: fbPost.message},
                //{header: 'fb.likes',          data: fbPost.likes},
                //{header: 'fb.comments',       data: fbPost.comments},
                //{header: 'fb.attachments',    data: fbPost.attachments},
                {header: 'fb.created_time',     data: fbPost.created_time}
            ],
            facebookUser: [
                {header: 'fb.user.id',                  data: fbUser.id},
                {header: 'fb.user.name',                data: fbUser.name},
                {header: 'fb.user.picture.data.url',    data: (fbUser.picture && fbUser.picture.data) ? fbUser.picture.data.url : ''}
            ],
            processing: [
                {header: 'status',      data: doc.status},
                {header: 'processed',   data: doc.processed}
            ],
            timestamps: [
                {header: 'modified',    data: doc.modified},
                {header: 'created',     data: doc.created}
            ]
        };

    // field groups
    var fieldGroups;
    switch(downloadType) {
        case 'districts-by-state':
            fieldGroups = ['general', 'seed', 'district', 'twitterTweet', 'twitterLocation', 'twitterUser', 'facebookPost', 'facebookUser', 'processing', 'timestamps'];
            break;
        case 'skip-limit':
            fieldGroups = ['general', 'seed', 'twitterTweet', 'twitterLocation', 'twitterUser', 'facebookPost', 'facebookUser', 'processing', 'timestamps'];
            break;
        default:
            return '';
    }

    // csv string
    var csvArray = [];
    for (var i=0, x=fieldGroups.length; i<x; i++) {
        if (config[fieldGroups[i]]) {
            for (var j=0, y=config[fieldGroups[i]].length; j<y; j++) {
                csvArray.push(config[fieldGroups[i]][j][headerOrData]);
            }
        }
    }

    // done
    return csvArray.map(csvEscape).join(delimiter);
}

/**
 * Get districts for a given state.
 * @param state - state code
 * @param clbk - return clbk(err, districts)
 */
function getDistricts(state, clbk) {
    if (!state) { return clbk(new Error('!state')); }
    
    Districts.find({state: state}, function(err, districtDocs) {
        if (err) { return clbk(new Error(err)); }
        if (!districtDocs) { return clbk(new Error('!districtDocs')); }
        
        return clbk(null, districtDocs);
    });
}

/**
 * Build filename for csv file.
 * @param query - req.query
 * @returns {string} - return filename
 */
function buildFilename(query) {
    var filename = 'socialmedia_'+query.type+'_';
    if (query.state) {
        filename += query.state+'_';
    }
    if (query.minDate) {
        var minDate = new Date(query.minDate),
            minYear = minDate.getFullYear(),
            minMonth = (minDate.getMonth()+1 < 10) ? '0'+minDate.getMonth()+1 : minDate.getMonth()+1,
            minDay = (minDate.getDate() < 10) ? '0'+minDate.getDate() : minDate.getDate();
        filename += 'from-'+minYear+'-'+minMonth+'-'+minDay+'_';
    }
    if (query.maxDate) {
        var maxDate = new Date(query.maxDate),
            maxYear = maxDate.getFullYear(),
            maxMonth = (maxDate.getMonth()+1 < 10) ? '0'+maxDate.getMonth()+1 : maxDate.getMonth()+1,
            maxDay = (maxDate.getDate() < 10) ? '0'+maxDate.getDate() : maxDate.getDate();
        filename += 'to-'+maxYear+'-'+maxMonth+'-'+maxDay+'_';
    }
    if (query.skip) {
        filename += 'skip-'+query.skip+'_';
    }
    if (query.limit) {
        filename += 'limit-'+query.limit+'_';
    }
    if (filename.charAt(filename.length-1) === '_') { 
        filename = filename.slice(0, -1); 
    }
    return filename;
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

    if (!req.user || !req.user._id) {return errorMessage(403, 'Please login or sign up if you want to download social media data.');}

    // build query
    var query = {};
    if (req.query.minDate || req.query.maxDate) {
        query.date = {};
        if (req.query.minDate) {query.date.$gt = new Date(req.query.minDate);}
        if (req.query.maxDate) {query.date.$lt = new Date(req.query.maxDate);}
    }
    logger.log(query);
    logger.log(req.query.skip);
    logger.log(req.query.limit);
    
    // start stream
    var streamStarted = false;
    function startStream() {
        res.setHeader('Content-disposition', 'attachment; filename=\"'+buildFilename(req.query)+'.csv\"');
        res.contentType('text/csv');
        res.write(getCsv(req.query.type, 'header', req.query.delimiter) + '\n');
        streamStarted = true;
    }

    // stream social media data
    function streamSocialMediaData(handleDataFxn) {
        logger.bold('streaming social media data');
        SocialMedia.find(query)
            .sort({date: -1})
            .skip((req.query.skip) ? Number(req.query.skip) : 0)
            .limit((req.query.limit) ? Number(req.query.limit) : null)
            .populate('socialseed', 'title')
            .stream()
            .on('data', handleDataFxn)
            .on('close', function() { res.end(); })
            .on('error', function(err) { error.log(new Error(err)); return errorMessage(); });
    }

    // districts by state download
    function districtsDownload() {
        
        // get districts
        logger.dash('getting districts');
        getDistricts(req.query.state, function(err, districts) {
            if (err) { error.log(err); return errorMessage(); }
            if (!districts) { error.log(new Error('!districts')); return errorMessage(); }
            logger.arrow(districts.length+' districts');

            // lookup district by seed id
            function lookupDistrict(seedId) {
                if (!seedId) { return null; }
                for (var i=0, x=districts.length; i<x; i++) {
                    if (districts[i].facebookSeed && districts[i].facebookSeed.toString() === seedId.toString()) { return districts[i]; }
                    if (districts[i].twitterSeed && districts[i].twitterSeed.toString() === seedId.toString()) { return districts[i]; }
                }
                return null;
            }

            // add district social seeds to query
            var districtSeedIds = [];
            districts.forEach(function(cV) {
                if (cV.facebookSeed) { districtSeedIds.push(cV.facebookSeed); }
                if (cV.twitterSeed) { districtSeedIds.push(cV.twitterSeed); }
            });
            query.socialseed = {$in: districtSeedIds};
            
            // stream social media data
            streamSocialMediaData(
                function(mediaDoc) {
                    if (!streamStarted) {startStream();}
                    mediaDoc.district = lookupDistrict(mediaDoc.socialseed._id);
                    res.write(getCsv(req.query.type, 'data', req.query.delimiter, mediaDoc) + '\n');
                }
            );
        });
    }

    // handle download types
    switch (req.query.type) {

        // districts download
        case 'districts-by-state':
            districtsDownload();
            break;

        // skip/limit download
        case 'skip-limit':
            streamSocialMediaData(
                function(mediaDoc) {
                    if (!streamStarted) { startStream(); }
                    res.write(getCsv(req.query.type, 'data', req.query.delimiter, mediaDoc) + '\n');
                }
            );
            break;

        // unsupported
        default:
            error.log(new Error('Download type "'+req.query.type+'" not supported.'));
            return errorMessage(400, 'Download type "'+req.query.type+'" not supported.');
    }
};