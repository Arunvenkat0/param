'use strict';

/**
 * Controller handling site map requests.
 *
 * @module controller/SiteMap
 */

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var view = require('~/cartridge/scripts/_view');

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
        view.get().render('sitemap/http_404');
    }
    else {
        view.get().render('sitemap/http_200');
    }
}

/**
 *
 */
function start() {

    view.get().render('sitemap/sitemap');

}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/* @see module:controller/SiteMap~google */
exports.Google = guard.filter(['get'], google);
/* @see module:controller/SiteMap~start */
exports.Start = guard.filter(['get'], start);
