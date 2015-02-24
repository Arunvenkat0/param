var g = require('./dw/guard');

/**
 * Pipeline is called by the system to handle URL mappings (static mappings and mapping rules). 
 * The mappings are configured in Business Manager. This Pipeline is highly performance cricitcal, 
 * because it is frequently called in case of explot scans. Please follow these rules:
 * - no or only few database calls
 * - simple (static) template response
 * - caching the result page is a must
 * In:
 * OriginalURL
 */
function Start()
{
    var RedirectURLResult = new dw.system.Pipelet('RedirectURL').execute();
    if (RedirectURLResult.result == PIPELET_ERROR)
    {
        response.renderTemplate('util/redirecterror');
        return;
    }
    var Location = RedirectURLResult.Location;


    response.renderTemplate('util/redirectpermanent', {
    	Location: Location
    });
}


/**
 * Hostname-only URLs (e.g. http://sitegenesis.com/) cannot be redirected using the URL mapping framework. 
 * Instead specify this pipeline in site's aliases in Business Manager. Per default a redirect to the homepage is 
 * performed. The hostname in the URL is site's HTTP Hostname - if configured in Business Manager. 
 * Also, you can provide an URL to redirect to (parameter Location). 
 * Example for aliases:
 * Redirect http[s]://sitegenesis.com/ to http://www.sitegenesis.com/:
 * sitegenesis.com,,RedirectURL-Hostname,Location,http://www.sitegenesis.com/
 * In:
 * Location (optional)
 */
function Hostname()
{
    var Location = request.httpParameterMap.Location.stringValue;
    
    if (empty(Location))
    {
        Location = dw.web.URLUtils.httpHome();
    }

    response.renderTemplate('util/redirectpermanent', {
    	Location: Location
    });
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Start       = g.get(Start);
exports.Hostname    = g.get(Hostname);
