'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Main

/**
 * Clean up text before ngram processing.
 * @param text - string
 */
exports.cleanTwitterText = function(text) {
    if (!text || typeof text !== 'string') { return null; }

    var regex;
    
    // replace weird stuff
    regex = /\&amp\;/;
    while (text.match(regex)) {text = text.replace(regex, ' and '); }
    regex = /\s\S+\.\.\./;
    while (text.match(regex)) {text = text.replace(regex, ' ... '); }
    
    // strip some weird stuff
    regex = /(\n|\t|\s\#\S*[^a-zA-Z0-9\s]\S*)/;
    while (text.match(regex)) { text = text.replace(regex, ' '); }

    // strip links everywhere
    regex = /(^https?\S+|\shttps?\S+)/;
    while (text.match(regex)) { text = text.replace(regex, ' '); }
    
    // strip retweet off front
    //regex = /(^RT|^\s+|^\@\S+|^\:|^\.)/;
    //while (text.match(regex)) { text = text.replace(regex, ''); }

    // strip hashtags off end
    //regex = /(^#\S+$|\s#\S+$|\s+$)/;
    //while (text.match(regex)) { text = text.replace(regex, ''); }

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