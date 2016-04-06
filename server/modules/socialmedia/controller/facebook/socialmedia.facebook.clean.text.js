'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Clean up text before ngram processing.
 * @param text - string
 */
exports.cleanFacebookText = function(text) {
    if (!text || typeof text !== 'string') { return null; }

    var regex;
    
    // replace weird stuff
    regex = /\&amp\;/;
    while (text.match(regex)) {text = text.replace(regex, ' and '); }
    regex = /\s\S+\.\.\./;
    while (text.match(regex)) {text = text.replace(regex, ' ... '); }
    
    // strip some weird stuff
    regex = /(\n|\t)/;
    while (text.match(regex)) { text = text.replace(regex, ' '); }

    // strip other
    
    // strip all weird stuff
    //regex = /[^a-zA-Z0-9\s\.\,\!\?\']/;
    //while (text.match(regex)) { text = text.replace(regex, ' '); }

    // normalize spaces
    text = text.trim();
    regex = /[\s]{2}/;
    while (text.match(regex)) { text = text.replace(regex, ' '); }
    
    // done
    return text;
};