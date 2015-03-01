'use strict';
/**
 * Renders the a content page or include.
 *
 * @module Page
 */

var guard = require('./dw/guard');
var contents = require('~/cartridge/scripts/object/Content');
var pageMeta = require('~/cartridge/scripts/meta');
/**
 * Renders a content page based on the rendering template configured for the page or a default rendering template.
 */
function show() {
    var assetId = request.httpParameterMap.cid.stringValue;
    var content = contents.get(assetId).object;
    if (!content || !content) {
    	response.setStatus(404);
        response.renderTemplate('error/notfound');
        return response;
    } else {
	    // @TODO replace with search module call
	    var contentSearchResult = require('./Search').GetContentResult().ContentSearchResult;
	
	    pageMeta.update(content);
	
	    response.renderTemplate(content.template || 'content/content/contentpage', {
	        Content: content,
	        ContentSearchResult: contentSearchResult,
	        // @FIXME This should not be required, but a require in the template will create a new meta instance
	        Meta: pageMeta
	    });
	    
	    return response;
    }
}


/**
 * Renders a content asset in order to include it into other pages via remote include.
 */
function include() {
    var assetId = request.httpParameterMap.cid.stringValue;
    var content = contents.get(assetId).object;

    response.renderTemplate('content/content/contentassetinclude', {
    	Content: content
    });
    return response;
}


/*
 * Export the publicly available controller methods
 */
exports.Show    = guard.filter(['get'],show);
exports.Include = guard.filter(['get'],include);
