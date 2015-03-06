'use strict';
/**
 * Renders the a content page or include.
 *
 * @module controller/Page
 */

var guard = require('./dw/guard');
var contents = require('~/cartridge/scripts/object/Content');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/_view');

/**
 * Renders a content page based on the rendering template configured for the page or a default rendering template.
 */
function show() {
    var assetId = request.httpParameterMap.cid.stringValue;
    var content = contents.get(assetId).object;
    if (!content || !content) {
    	response.setStatus(404);
        view.get().render('error/notfound');
        return response;
    } else {
	    // @TODO replace with search module call
	    var contentSearchResult = require('./Search').GetContentResult().ContentSearchResult;

	    pageMeta.update(content);

        view.get({
            Content: content,
            ContentSearchResult: contentSearchResult, Meta : pageMeta
        }).render(content.template || 'content/content/contentpage');

	    return response;
    }
}


/**
 * Renders a content asset in order to include it into other pages via remote include.
 */
function include() {
    var assetId = request.httpParameterMap.cid.stringValue;
    var content = contents.get(assetId).object;

    view.get({
        Content: content,
    }).render(content.template || 'content/content/contentassetinclude');

    return response;
}


/*
 * Export the publicly available controller methods
 */
/** @see module:controller/Page~show */
exports.Show    = guard.filter(['get'],show);
/** @see module:controller/Page~include */
exports.Include = guard.filter(['get'],include);
