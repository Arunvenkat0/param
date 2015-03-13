'use strict';

/**
 * Default entry point when www.mydomain.com is opened
 *
 * @module controller/Default
 */

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var view = require('~/cartridge/scripts/view');

/**
 * Default entry point when www.mydomain.com is opened
 */
function start() {

    // redirect to Home-Show
    response.redirect(dw.web.URLUtils.abs('Home-Show'));

}

/**
 * Called when site is turned offline (not live)
 */
function offline() {

    view.get().render('error/siteoffline');

}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/Default~start */
exports.Start = guard.ensure(['get'], start);
/** @see module:controller/Default~offline */
exports.Offline = guard.ensure(['get'], offline);
