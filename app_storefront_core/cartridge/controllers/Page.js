'use strict';
/**
 * Renders a content page or a content include.
 *
 * @module controller/Page
 */

/* API Includes */
var Content = require('~/cartridge/scripts/model/Content');
var Search = require('~/cartridge/scripts/model/Search');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/view');

/**
 * Renders a content page based on the rendering template configured for the page or a default rendering template.
 */
function show() {

    var content = Content.get(request.httpParameterMap.cid.stringValue).object;

    if (!content) {
        dw.system.Logger.warn('Content page for asset ID {0} was requested but asset not found',request.httpParameterMap.cid.stringValue);
        response.setStatus(404);
        view.get().render('error/notfound');
    }
    else {
        var contentSearchModel = Search.initializeContentSearchModel(request.httpParameterMap);
        contentSearchModel.setContentID(null);
        contentSearchModel.search();

        pageMeta.update(content);

        view.get({
            Content             : content,
            ContentSearchResult : contentSearchModel
        }).render(content.template || 'content/content/contentpage');
    }

}


/**
 * Renders a content asset in order to include it into other pages via remote include.
 */
function include() {

    var content = Content.get(request.httpParameterMap.cid.stringValue).object;

    if(content){
        view.get({
            Content : content
        }).render(content.template || 'content/content/contentassetinclude');
    }else{
        dw.system.Logger.warn('Content asset with ID {0} was included but not found',request.httpParameterMap.cid.stringValue);
    }
}


/*
 * Export the publicly available controller methods
 */
/** @see module:controller/Page~show */
exports.Show = guard.filter(['get'], show);
/** @see module:controller/Page~include */
exports.Include = guard.filter(['get'], include);
