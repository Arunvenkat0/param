var g = require('./dw/guard');

function Start()
{
	// redirect to Home-Show
	response.redirect(dw.web.URLUtils.abs('Home-Show'));
}

function Offline()
{
	response.renderTemplate('error/siteoffline');
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Start   = g.get(Start);
exports.Offline = g.get(Offline);
