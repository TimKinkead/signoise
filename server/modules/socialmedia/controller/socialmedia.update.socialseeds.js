'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var request = require('request'),
    url = require('url');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    SocialSeed = mongoose.model('SocialSeed');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error/index'),
    logger = require('../../logger/index');

//----------------------------------------------------------------------------------------------------------------------
// Methods

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALMEDIA.UPDATE.SOCIALSEEDS
 * - Update social seeds to reference user account.
 * - Run this once in a while.
 */
exports.updateSocialSeeds = function(req, res) {
    logger.filename(__filename);

    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Update Social Seeds Error!',
            message: message || 'We had trouble updating the social seeds. Please try again.'
        });
    }
    
    // get non-screen_name social seeds
    SocialSeed.find({platform: 'twitter', 'twitter.type': {$ne: 'screen_name'}})
        .select('_id')
        .exec(function(err, seedDocs) {
            if (err) { error.log(new Error(err)); errorMessage(); return; }
            if (!seedDocs) { error.log(new Error('!seedDocs')); errorMessage(); return; }
            
            // grab seed ids
            var seedIds = [];
            seedDocs.forEach(function(cV) {
                if (cV._id) { seedIds.push(cV._id); } 
            });
            
            // get social media
            SocialMedia.find({socialseed: {$in: seedIds}})
                .limit(5000)
                .select('_id data.user.screen_name')
                .exec(function(err, mediaDocs) {
                    if (err) { error.log(new Error(err)); errorMessage(); return; }
                    if (!mediaDocs) { error.log(new Error('!mediaDocs')); errorMessage(); return; }
                    
                    // update media docs
                    var mediaDocIndex = 0;
                    function updateMediaDoc() {

                        function nextMediaDoc(delay) {
                            mediaDocIndex++;
                            if (mediaDocIndex >= mediaDocs.length) { logger.arrow('done'); return res.status(200).send('Done updating social seeds.'); }
                            if (delay) { setTimeout(function() { updateMediaDoc(); }, 1000*60*delay); return; }
                            updateMediaDoc();
                        }
                        
                        var mediaDoc = mediaDocs[mediaDocIndex];
                        if (!mediaDoc) { nextMediaDoc(); }
                        if (mediaDocIndex < 10 || mediaDocIndex%100 === 0 || (mediaDocIndex+1) === mediaDocs.length) {
                            logger.tab((mediaDocIndex+1)+'/'+mediaDocs.length+' ('+Math.round(((mediaDocIndex+1)+'/'+mediaDocs.length)*100)+'%)');
                        }
                        
                        // get seed for user account
                        
                        
                    }
                    
                    // start
                    updateMediaDoc();
                });
        });
};