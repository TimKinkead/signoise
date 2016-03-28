'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var chalk = require('chalk');

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialMedia = mongoose.model('SocialMedia'),
    SocialSeed = mongoose.model('SocialSeed');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * Find or create social seed for media doc & update media doc.
 * @param mediaDoc - social media doc
 * @param clbk - return clbk(err)
 */
function updateMediaDoc(mediaDoc, clbk) {
    if (!mediaDoc || !mediaDoc.data || !mediaDoc.data.user || !mediaDoc.data.user.screen_name) {
        return clbk('!mediaDoc.data.user.screen_name');
    }

    // find social seed
    SocialSeed.findOne({platform: 'twitter', title: '@'+mediaDoc.data.user.screen_name})
        .exec(function(err, seedDoc) {
            if (err) {return clbk(err);}
            
            // update media doc if seed exists
            if (seedDoc) {
                SocialMedia.update(
                    {_id: mediaDoc._id}, 
                    {$set: {socialseed: seedDoc._id}},
                    function(err) {
                        if (err) {return clbk(err);}
                        return clbk();
                    }
                );
                return;
            }
            
            // otherwise create new social seed
            SocialSeed.create(
                {platform: 'twitter', twitter: {query: '@'+mediaDoc.data.user.screen_name}},
                function(err, newSeedDoc) {
                    if (err) {return clbk(err);}
                    if (!newSeedDoc) {return clbk('!newSeedDoc');}
                    
                    // then update media doc
                    SocialMedia.update(
                        {_id: mediaDoc._id},
                        {$set: {socialseed: newSeedDoc._id}},
                        function(err) {
                            if (err) {return clbk(err);}
                            return clbk();
                        }
                    );
                }
            );
        });
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Update existing social media docs that aren't tied to a seed.
 * - Find or create a seed doc for each social media doc.
 * - Only for connecting tweets to user's screen_name social seed.
 */
exports.update = function(req, res) {
    res.status(200).send('working on updating social media docs');
    console.log(chalk.green.bold('\nUpdating Social Media Docs\n'));

    // get a batch of social media docs that don't have a seed
    SocialMedia.find({platform: 'twitter', socialseed: {$exists: false}})
        .limit(1000)
        .exec(function(err, mediaDocs) {
            if (err || !mediaDocs) {
                console.log(chalk.red.bold('Error!'));
                console.log(chalk.red(err || '!mediaDocs'));
                return;
            }
            if (!mediaDocs.length) {
                console.log(chalk.green.bold('All Social Media Docs Updated!'));
                return;
            }
            console.log('-> updating '+mediaDocs.length+' media docs\n');

            // update social media docs
            var mediaDocIndex = 0;
            function update() {
                var mediaDoc = mediaDocs[mediaDocIndex];
                updateMediaDoc(mediaDoc, function(err) {
                    if (err) {
                        console.log(chalk.red.bold('Error!'));
                        console.log(chalk.red(err || '!mediaDocs'));
                    }

                    // progress report
                    if (mediaDocIndex % 100 === 0) {
                        console.log(mediaDocIndex+'/'+mediaDocs.length+' ('+Math.round(mediaDocIndex/mediaDocs.length*100)+'%)');
                    }

                    // next doc
                    mediaDocIndex++;
                    if (mediaDocs[mediaDocIndex]) {
                        update();
                    } else {
                        console.log(chalk.green.bold('Done!'));
                    }
                });
            }
            
            // start
            update();
        });  
};