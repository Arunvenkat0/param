var g = require('./dw/guard');

/**
 * The pipeline hook for a source code redirect.
 */
function Start()
{
    var SourceCodeRedirectURLResult = new dw.system.Pipelet('SourceCodeRedirectURL').execute();
    if (SourceCodeRedirectURLResult.result == PIPELET_ERROR)
    {
        var HomeController = require('./Home');
        HomeController.Show();
        return;
    }
    var Location = SourceCodeRedirectURLResult.Location;

    response.renderTemplate('util/redirect', {
    	Location: Location
    });
}


/*
 * Module exports
 */

/*
 * Web exposed methods 
 */
exports.Start = g.get(Start);
