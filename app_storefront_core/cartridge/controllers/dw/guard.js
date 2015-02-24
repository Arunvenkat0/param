/**
 * This is a collection of decorators for functions which performs several security checks.
 * They can be combined with each other to configure the necessary constraints for a function that is exposed to the Internet.
 */

/**
 * Guard that switches to HTTPS if the current request is not secure. If the
 * request was a POST and cannot be switched, an HTTP error 403 (Forbidden) is
 * sent.
 */
function https(action)
{
    return expose(function()
    {
        if (request.isHttpSecure())
        {
            dw.system.Console.println("*** guard https ok");

            action();
            return;
        }

        // not secure, try to switch to https
        if (request.httpMethod === 'GET')
        {
            dw.system.Console.println("*** guard non-https access to '" + action.name + "' denied, switching to https");

            switchToHttps();
            return;
        }

        dw.system.Console.println("*** guard non-https access to '" + action.name + "' denied");

        // switching is not possible, send error 403 (forbidden)
        response.sendError(403);
    });
}

/**
 * Performs a protocol switch for the URL of the current request to https.
 * Responds with a redirect to the client.
 */
function switchToHttps()
{
    var url = 'https://' + request.httpHost + request.httpPath;

    if (!empty(request.httpQueryString))
    {
        url += '?' + request.httpQueryString;
    }

    response.redirect(url);
}

/**
 * Guard that only accepts POST requests. For other methods, an HTTP error 405
 * (Not Allowed) is sent.
 */
function post(action)
{
    return expose(function()
    {
        if (request.httpMethod != 'POST')
        {
            dw.system.Console.println("*** guard non-post access to '" + action.name + "' denied for " + request.httpMethod);

            // send method not allowed
            response.sendError(405);
            return;
        }

        dw.system.Console.println("*** guard post ok");

        action();
    });
}

/**
 * Guard that only accepts GET requests. For other methods, an HTTP error 405
 * (Not Allowed) is sent.
 */
function get(action)
{
    return expose(function()
    {
        if (request.httpMethod != 'GET')
        {
            dw.system.Console.println("*** guard non-get access to '" + action.name + "' denied for " + request.httpMethod);

            // send method not allowed
            response.sendError(405);
            return;
        }

        dw.system.Console.println("*** guard get ok");

        action();
    });
}

/**
 * Exposes the given action to be accessible from the web. The action gets a
 * property which marks it as exposed. This property is checked by the platform.
 */
function expose(action)
{
    action.public = true;
    return action;
}

/*
 * Module exports
 */
exports.https = https;
exports.get = get;
exports.post = post;
exports.all = expose;

// often needed combinations
exports.httpsGet = function(action)
{
    return https(get(action));
};

exports.httpsPost = function(action)
{
    return https(post(action));
};

exports.switchToHttps = switchToHttps;
