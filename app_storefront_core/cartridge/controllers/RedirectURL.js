'use strict';

/**
 * Controller handling URL redirects.
 *
 * @module controller/RedirectURL
 */

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var view = require('~/cartridge/scripts/view');

/**
 * Pipeline is called by the system to handle URL mappings (static mappings and mapping rules).
 * The mappings are configured in Business Manager. This Pipeline is highly performance critical,
 * because it is frequently called in case of exploit scans. Please follow these rules:
 * - no or only few database calls
 * - simple (static) template response
 * - caching the result page is a must
 * In:
 * OriginalURL
 */
function start() {

    // TODO - rework
    var RedirectURLResult = new dw.system.Pipelet('RedirectURL').execute();

    if (RedirectURLResult.result === PIPELET_ERROR) {
        view.get().render('util/redirecterrorutil/redirecterror');
    }
    else {
        view.get({
            Location : RedirectURLResult.Location
        }).render('util/redirectpermanent');
    }
}

/**
 * Hostname-only URLs (e.g. http://sitegenesis.com/) cannot be redirected using the URL mapping framework.
 * Instead specify this pipeline in site's aliases in Business Manager. Per default a redirect to the homepage is
 * performed. The hostname in the URL is site's HTTP Hostname - if configured in Business Manager.
 * Also, you can provide an URL to redirect to (parameter Location).
 * Example for aliases:
 * Redirect http[s]://sitegenesis.com/ to http://www.sitegenesis.com/:
 * sitegenesis.com,,RedirectURL-Hostname,Location,http://www.sitegenesis.com/
 * In:
 * Location (optional)
 */
function hostName() {

    view.get({
        Location : request.httpParameterMap.Location.stringValue || dw.web.URLUtils.httpHome()
    }).render('util/redirectpermanent');

}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/RedirectURL~start */
exports.Start = guard.ensure(['get'], start);
/** @see module:controller/RedirectURL~hostName */
exports.Hostname = guard.ensure(['get'], hostName);
