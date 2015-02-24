var g = require('./dw/guard');

/**
 * This is the pipeline hook for the reporting events. Typically no modifications are needed here. 
 * Demandware analytics is based on log file analysis. Log file entries are generated using remote includes in page templates.
 */
function Start()
{
    response.renderTemplate('util/reporting/reporting');
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Start = g.get(Start);
