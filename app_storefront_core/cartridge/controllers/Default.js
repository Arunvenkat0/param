'use strict';

/**
 * Default entry point when www.mydomain.com is opened
 *
 * @module controller/Default
 */

var g = require('./dw/guard');

/**
 * Default entry point when www.mydomain.com is opened
 */
function start()
{
	// redirect to Home-Show
	response.redirect(dw.web.URLUtils.abs('Home-Show'));
}

/**
 * Called when site is turned offline (not live)
 */
function offline()
{
	response.renderTemplate('error/siteoffline');
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/Default~start */
exports.Start   = g.get(start);
/** @see module:controller/Default~offline */
exports.Offline = g.get(offline);
