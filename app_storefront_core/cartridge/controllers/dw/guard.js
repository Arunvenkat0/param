/**
 * This is a collection of decorators for functions which performs several security checks.
 * They can be combined with each other to configure the necessary constraints for a function that is exposed to the Internet.
 */

/**
 * Guard that ensures that the provided action is only executed when the request is secure (e.g. the schema is HTTPS).
 * If it is not secure, the provided error handler is called. If no error handler is provided, by default a switch to
 * HTTPS is attempted.
 * 
 * @param action the action to the executed if the request is HTTPS
 * @param error the optional error handler which should be called if the request is not HTTPS
 */
function https(action, error)
{
    return expose(function()
    {
        if (request.isHttpSecure())
        {
            dw.system.Console.println("*** guard https ok");

            action();
            return;
        }

        if (error != null)
        {
            dw.system.Console.println("*** guard non-https access to '" + action.name
                    + "' denied, calling error handler");
            error();
            return;
        }

        // no error handler, use default behavior
        dw.system.Console
                .println("*** guard non-https access to '" + action.name + "' denied, calling default handler");

        // try to switch to https
        switchToHttps();
    });
}

/**
 * Performs a protocol switch for the URL of the current request to HTTPS. Responds with a redirect to the client.
 * 
 * @return false, if switching is not possible (for example, because its a POST request)
 */
function switchToHttps()
{
    if (request.httpMethod != 'GET')
    {
        // switching is not possible, send error 403 (forbidden)
        response.sendError(403);
        return false;
    }

    var url = 'https://' + request.httpHost + request.httpPath;

    if (!empty(request.httpQueryString))
    {
        url += '?' + request.httpQueryString;
    }

    response.redirect(url);
    return true;
}

/**
 * Guard that only accepts POST requests. For other methods, an HTTP error 405 (Not Allowed) is sent.
 */
function post(action)
{
    return expose(function()
    {
        if (request.httpMethod != 'POST')
        {
            dw.system.Console.println("*** guard non-post access to '" + action.name + "' denied for "
                    + request.httpMethod);

            // send method not allowed
            response.sendError(405);
            return;
        }

        dw.system.Console.println("*** guard post ok");

        action();
    });
}

/**
 * Guard that only accepts GET requests. For other methods, an HTTP error 405 (Not Allowed) is sent.
 */
function get(action)
{
    return expose(function()
    {
        if (request.httpMethod != 'GET')
        {
            dw.system.Console.println("*** guard non-get access to '" + action.name + "' denied for "
                    + request.httpMethod);

            // send method not allowed
            response.sendError(405);
            return;
        }

        dw.system.Console.println("*** guard get ok");

        action();
    });
}

/**
 * Exposes the given action to be accessible from the web. The action gets a property which marks it as exposed. This
 * property is checked by the platform.
 */
function expose(action)
{
    action.public = true;
    return action;
}

/**
 * Executes the given action in a transactional context. This allows for atomic changes in the database.
 */
function transactional(action)
{
    var txn = require('dw/system/Transaction');
    txn.begin();

    action();

    txn.commit();
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

exports.transactional = transactional;
