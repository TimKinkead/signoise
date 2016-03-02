'use strict';

//----------------------------------------------------------------------------------------------------------------------
// Variables

var auth = require('../../../../auth.js');

//----------------------------------------------------------------------------------------------------------------------
// Dependencies

var sendgrid = require('sendgrid')(auth.sendgridSecretKey),
	swig = require('swig');

//----------------------------------------------------------------------------------------------------------------------
// Controllers

var logError = require('./error.log.js').log,
    logger = require('../../logger');

//----------------------------------------------------------------------------------------------------------------------
// Methods

/**
 * ERROR.PRIORITY
 * - Send email to errors@Betaknot.com
 * - Not in email module b/c scoping issues when they reference each other.
 */
exports.priority = function(errObj) {
    logger.filename(__filename);

    if (!errObj || (errObj.constructor !== Error && typeof errObj !== 'object')) {return;}
    errObj.priority = true;

    // save error
    logError(errObj);

    // send email
    //logger.operation('send email');
    var d = new Date(),
        email = new sendgrid.Email({
            to: 'errors@betaknot.com',
            toname: 'Betaknot Errors',
            from: 'server@betaknot.com',
            fromname: 'Betaknot Server',
            subject: 'Betaknot Priority Error ('+(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear()+')',
            html: swig.renderFile(
                'server/modules/error/controller/error.email.html',
                {err: errObj}
            )
        });
    if (process.env.SERVER === 'cloud') {
        email.addCategory('betaknot');
        email.addCategory('betaknot-error');
    } else {
        email.addCategory('betaknot-dev');
    }
    sendgrid.send(email, function(err, info) {
        if (err) {
            if (info) {err.info = info;}
            logError(err);
        }
    });
};
