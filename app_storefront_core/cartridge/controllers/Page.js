'use strict';
/**
 * Renders the a content page or include.
 *
 * @module Page
 */

var g = require('./dw/guard');
var ContentMgr = require('dw/content/ContentMgr');

/**
 * Renders a content page based on the rendering template configured for the page or a default rendering template.
 */
function show()
{
    var assetId = request.httpParameterMap.cid.stringValue;
    var content = ContentMgr.getContent(assetId);
    if (!content)
    {
        response.renderTemplate('error/notfound');
        return;
    }

    // @TODO replace with search module call
    var SearchController = require('./Search');
    var GetContentResultResult = SearchController.GetContentResult();
    var ContentSearchResult = GetContentResultResult.ContentSearchResult;

    require('~/cartridge/scripts/meta').update(content);

    response.renderTemplate(content.template || 'content/content/contentpage', {
        Content: content,
        ContentSearchResult: ContentSearchResult,
        // @FIXME This should not be required, but a require in the template will create a new meta instance
        Meta: require('~/cartridge/scripts/meta')
    });
}


/**
 * Renders a content asset in order to include it into other pages via remote include.
 */
function include()
{
    var assetId = request.httpParameterMap.cid.stringValue;
    var content = ContentMgr.getContent(assetId);

    response.renderTemplate('content/content/contentassetinclude', {
    	Content: content
    });
}


/*
 * Export the publicly available controller methods
 */
exports.Show    = g.get(show);
exports.Include = g.get(include);
