'use strict';

/**
 * This controller renders a content page or a content include.
 *
 * @module controllers/Page
 */

/* API Includes */
var Logger = require('dw/system/Logger');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Renders a content page based on the rendering template configured for the page or a default rendering template.
 */
function show() {

    var Content = app.getModel('Content');
    var content = Content.get(request.httpParameterMap.cid.stringValue).object;

    if (!content) {
        Logger.warn('Content page for asset ID {0} was requested but asset not found',request.httpParameterMap.cid.stringValue);
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    } else {
        var Search = app.getModel('Search');
        var contentSearchModel = Search.initializeContentSearchModel(request.httpParameterMap);
        contentSearchModel.setContentID(null);
        contentSearchModel.search();

        require('~/cartridge/scripts/meta').update(content);

        app.getView({
            Content: content,
            ContentSearchResult: contentSearchModel
        }).render(content.template || 'content/content/contentpage');
    }

}


/**
 * Renders a content asset in order to include it into other pages via remote include.
 */
function include() {

    var Content = app.getModel('Content');
    var content = Content.get(request.httpParameterMap.cid.stringValue).object;

    if (content) {
        app.getView({
            Content: content
        }).render(content.template || 'content/content/contentassetinclude');
    } else {
        Logger.warn('Content asset with ID {0} was included but not found',request.httpParameterMap.cid.stringValue);
    }
}

/*
 * Export the publicly available controller methods
 */
/** @see module:controllers/Page~show */
exports.Show = guard.ensure(['get'], show);
/** @see module:controllers/Page~include */
exports.Include = guard.ensure(['include'], include);
