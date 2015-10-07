'use strict';

/**
 * This controller handles site map requests.
 *
 * @module controllers/SiteMap
 */

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * This pipeline is used to serve requests for Google XML site maps.
 * SiteMap Rule:
 * # process sitemaps
 * RewriteRule ^/(sitemap([^/]*))$ /on/demandware.store/%{HTTP_HOST}/-/SiteMap-Google?name=$1 [PT,L]
 */
function google() {
    // TODO - rework
    var SendGoogleSiteMapResult = new dw.system.Pipelet('SendGoogleSiteMap').execute({
        FileName : request.httpParameterMap.name.stringValue
    });
    if (SendGoogleSiteMapResult.result === PIPELET_ERROR) {
        app.getView().render('sitemap/http_404');
    }
    else {
        app.getView().render('sitemap/http_200');
    }
}

/**
 * Renders the sitemap template.
 */
function start() {

    app.getView().render('sitemap/sitemap');

}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/SiteMap~google */
exports.Google = guard.ensure(['get'], google);
/** @see module:controllers/SiteMap~start */
exports.Start = guard.ensure(['get'], start);
