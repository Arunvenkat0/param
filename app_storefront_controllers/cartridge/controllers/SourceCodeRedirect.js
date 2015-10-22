'use strict';

/**
 * This controller is the handler module for a source code redirect.
 *
 * @module controllers/SourceCodeRedirect
 */

var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * The handler function for a source code redirect.
 */
function start() {
    var sourceCodeRedirectURLResult = new dw.system.Pipelet('SourceCodeRedirectURL').execute();
    if (sourceCodeRedirectURLResult.result === PIPELET_ERROR) {
        app.getController('Home').Show();
        return;
    }
    var location = sourceCodeRedirectURLResult.Location;

    app.getView().render('util/redirect', {
        Location: location
    });
}

/*
 * Web exposed methods
 */
/** @see module:controllers/SourceCodeRedirect~start */
exports.Start = guard.ensure(['get'], start);