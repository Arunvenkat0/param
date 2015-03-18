'use strict';
/**
 * Renders a content page or a content include.
 *
 * @module controller/Resources
 */

/**
 * Pipeline for dynamically generated page resources (js, css)
 */
function load()
{
    var resourceTemplate = 'resources/' + request.httpParameterMap.t.stringValue;

    response.renderTemplate(resourceTemplate);
}

/*
 * Export the publicly available controller methods
 */
/**
 * @see module:controller/Resources~load
 * @deprecated Use <code>require('meta').addResource('some.message.key','bundlename')</code>
 * instead to pass data to the client
 */
exports.Load = load;
