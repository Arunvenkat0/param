var g = require('./dw/guard');

/**
 * This pipeline is used to serve requests for Google XML site maps.
 * SiteMap Rule:
 * # process sitemaps
 * RewriteRule ^/(sitemap([^/]*))$ /on/demandware.store/%{HTTP_HOST}/-/SiteMap-Google?name=$1 [PT,L]
 */
function Google()
{
    var SendGoogleSiteMapResult = new dw.system.Pipelet('SendGoogleSiteMap').execute({
        FileName: request.httpParameterMap.name.stringValue
    });
    if (SendGoogleSiteMapResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('sitemap/http_404');
    }
    else
	{
        response.renderTemplate('sitemap/http_200');
    }
}


function Start()
{
    response.renderTemplate('sitemap/sitemap');
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Google  = g.get(Google);
exports.Start   = g.get(Start);
