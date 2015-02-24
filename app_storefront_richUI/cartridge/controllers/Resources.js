/**
 * Pipeline for dynamically generated page resources (js, css)
 */
function Load()
{
    var CurrentHttpParameterMap = request.httpParameterMap;

    /*
     * Resource Template
     */
    var resourceTemplate = 'resources/' + CurrentHttpParameterMap.t.stringValue;

    response.renderTemplate(resourceTemplate);
}

/*
 * Module exports
 */
exports.Load = Load;
