var g = require('./dw/guard');

/**
 * Renders a content page based on the rendering template configured for the page or a default rendering template.
 */
function Show()
{
    var GetContentResult = new dw.system.Pipelet('GetContent').execute({
        ContentID: request.httpParameterMap.cid.stringValue
    });
    if (GetContentResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('error/notfound');
        return;
    }
    var Content = GetContentResult.Content;


    var SearchController = require('./Search');
    var GetContentResultResult = SearchController.GetContentResult();
    var ContentSearchResult = GetContentResultResult.ContentSearchResult;
    
    var web = require('./dw/web');
    web.updatePageMetaDataForContent(Content);

    
    if (empty(Content.template))
    {
        response.renderTemplate('content/content/contentpage', {
            Content: Content,
            ContentSearchResult: ContentSearchResult
        });
    }
    else
    {
    	// dynamic template
        response.renderTemplate(Content.template, {
            Content: Content,
            ContentSearchResult: ContentSearchResult
        });
    }
}


/**
 * Renders a content asset in order to include it into other pages via remote include.
 */
function Include()
{
    var GetContentResult = new dw.system.Pipelet('GetContent').execute({
        ContentID: request.httpParameterMap.cid.stringValue
    });
    if (GetContentResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('content/content/contentassetinclude');
        return;
    }

	var Content = GetContentResult.Content;
	
    response.renderTemplate('content/content/contentassetinclude', {
    	Content: Content
    });
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Show    = g.get(Show);
exports.Include = g.get(Include);
