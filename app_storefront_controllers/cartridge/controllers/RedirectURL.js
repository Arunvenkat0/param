'use strict';

/**
 * This controller handles URL redirects.
 * It is called by the system to handle URL mappings (static mappings and mapping rules).
 * The mappings are configured in Business Manager. This controller is highly performance critical,
 * because it is frequently called in case of exploit scans. Please follow these rules:
 * - no or only a few database calls
 * - simple (static) template response
 * - caching the result page is a must
 *
 * @module controllers/RedirectURL
 */

/* API Includes */
var URLRedirectMgr = require('dw/web/URLRedirectMgr');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Renders the template for a redirect.
 */
function start() {
    var redirect = URLRedirectMgr.getRedirect();

    if (redirect === null) {
        app.getView().render('util/redirecterrorutil/redirecterror');
    } else {
        app.getView({
            Location: redirect.location
        }).render('util/redirectpermanent');
    }
}

/**
 * Hostname-only URLs (e.g. http://sitegenesis.com/) cannot be redirected using the URL mapping framework.
 * Instead, specify this controller in your site's hostname aliases in Business Manager.
 * Per the default controller, a redirect to the homepage is performed.
 * The hostname in the URL is the site's HTTP Hostname, if one is configured in Business Manager.
 * Also, you can provide a URL to redirect to (parameter Location).
 * Example for aliases:
 * Redirect http[s]://sitegenesis.com/ to http://www.sitegenesis.com/:
 * sitegenesis.com,,RedirectURL-Hostname,Location,http://www.sitegenesis.com/
 * In:
 * Location (optional)
 */
function hostName() {
    var Redirect = require('app_storefront_core/cartridge/scripts/util/Redirect');
    app.getView({
        Location: Redirect.validateURL(request.httpParameterMap.Location.stringValue)
    }).render('util/redirectpermanent');
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/RedirectURL~start */
exports.Start = guard.ensure([], start);
/** @see module:controllers/RedirectURL~hostName */
exports.Hostname = guard.ensure([], hostName);
