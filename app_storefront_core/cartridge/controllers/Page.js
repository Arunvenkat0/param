'use strict';
/**
 * Renders the a content page or include.
 *
 * @module controller/Page
 */

/* API Includes */
var Content = require('~/cartridge/scripts/object/Content');
var Search = require('~/cartridge/scripts/object/Search');

/* Script Modules */
var guard = require('./dw/guard');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/_view');

/**
 * Renders a content page based on the rendering template configured for the page or a default rendering template.
 */
function show() {

    var content = Content.get(request.httpParameterMap.cid.stringValue).object;

    if (!content) {
        response.setStatus(404);
        view.get().render('error/notfound');
    }
    else {
        var contentSearchModel = Search.initializeContentSearchModel(request.httpParameterMap);
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

    view.get({
        Content : content
    }).render(content.template || 'content/content/contentassetinclude');

}


/*
 * Export the publicly available controller methods
 */
/** @see module:controller/Page~show */
exports.Show = guard.filter(['get'], show);

/** @see module:controller/Page~include */
exports.Include = guard.filter(['get'], include);
