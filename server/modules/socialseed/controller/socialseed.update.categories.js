'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Models

var mongoose = require('mongoose'),
    SocialSeed = mongoose.model('SocialSeed');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var error = require('../../error'),
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

function getCategories(seed) {
    var categories = [],
        ogStr = (seed && seed.data && seed.data.description && seed.data.description.constructor === String) ? seed.data.description : '',
        lcStr = ogStr.toLowerCase();

    // general
    if (/school/.test(lcStr)) { categories.push('school'); }
    if (/(education|classroom)/.test(lcStr)) { categories.push('education'); }
    if (/common\s?core/.test(lcStr)) { categories.push('common core'); }
    if (/official/.test(lcStr)) { categories.push('official'); }
    
    // organization
    if (/(?=.*district)(?=.*school)/.test(lcStr)) { categories.push('district'); }
    if (/(?=.*county office)(?=.*education)/.test(lcStr)) { categories.push('coe'); }
    if (/PTA/.test(ogStr) || /(?=.*parent)(?=.*teacher)(?=.*association)/.test(lcStr)) { categories.push('pta'); }
    if (/foundation/.test(lcStr)) { categories.push('foundation'); }
    if (/(non profit|non-profit)/.test(lcStr)) { categories.push('non profit'); }

    // school type
    if (/(university of|college)/.test(lcStr)) { categories.push('college'); }
    if (/(high school|at\s.*\sHS|\s[A-Z]{1,2}HS)/.test(lcStr)) { categories.push('high school'); }
    if (/middle school/.test(lcStr)) { categories.push('middle school'); }
    if (/((?=.*elementary)(?=.*school)|grade school)/.test(lcStr)) { categories.push('elementary school'); }
    if (/(preschool|pre-school|pre school|pre-k|pre k)/.test(lcStr)) { categories.push('pre school'); }
    
    // person type
    if (/(teacher[^s]|teacher$)/.test(lcStr)) { categories.push('teacher'); }
    if (/(student[^s]|student$)/.test(lcStr)) { categories.push('student'); }
    if (/(mom|dad|mother|father|parent[^s]|parent$)/.test(lcStr)) { categories.push('parent'); }
    if (/(?=.*principal)(?=.*school)/.test(lcStr)) { categories.push('principal'); }
    if (/(?=.*superintendent)(?=(.*school|.*education))/.test(lcStr)) { categories.push('superintendent'); }

    // other
    if (/(sport|athletic|football|soccer|basketball|baseball|tennis|golf|lacrosse|volleyball|(?=.*track)(?=.*field))/.test(lcStr)) { categories.push('sports'); }

    return categories;
}

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * SOCIALSEED.UPDATE.CATEGORIES
 * - Update social seed categories.
 */
exports.updateCategories = function(req, res) {
    logger.filename(__filename);

    var limit = 100,
        oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate()-7);
    
    function errorMessage(code, message) {
        return res.status(code || 500).send({
            header: 'Update Social Seed Categories Error!',
            message: message || 'We had trouble updating social seed categories. Please try again.'
        });
    }
    
    // get seeds
    logger.dash('getting seeds');
    SocialSeed.find({
        'twitter.type': 'screen_name',
        'data.description': {$exists: true, $ne: ''},
        categoriesProtected: {$ne: true},
        $or: [{categoriesUpdated: {$exists: false}}, {categoriesUpdated: {$lt: oneWeekAgo}}]
    })
        .limit(limit)
        .exec(function(err, seedDocs) {
            if (err) { error.log(new Error(err)); errorMessage(); return; }
            if (!seedDocs) { error.log(new Error('!seedDocs')); errorMessage(); return; }
            if (!seedDocs.length) { res.status(200).send('No seeds to update right now.'); return; }
            logger.arrow(seedDocs.length+' seeds');

            seedDocs.forEach(function(seed, index) {
                SocialSeed.update(
                    {_id: seed._id},
                    {$addToSet: {categories: {$each: getCategories(seed)}}, $set: {categoriesUpdated: new Date()}},
                    function(err) {
                        if (err) { error.log(new Error(err)); }
                        if (index === 0 || index%10 === 0 || index+1 === limit) {
                            logger.tab((index+1)+'/'+seedDocs.length+' seed updated ('+Math.round((index+1)/seedDocs.length*100)+'%)');
                        }
                    }
                );
            });

            return res.status(200).send('Working on updating seed categories.');
        });
};