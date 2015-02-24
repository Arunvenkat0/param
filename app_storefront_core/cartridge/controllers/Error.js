var g = require('./dw/guard');

/**
 * This pipeline is called whenever a technical error occurs while processing a
 * request. A standard error page will be shown.
 */

/**
 * Called by the system when an error was not handled locally (general error
 * page). In: PipelineName ErrorText
 */
function Start(args)
{
    // TODO don't call it pipeline anymore
    var PipelineName = args.PipelineName;
    var ErrorText = args.ErrorText;

    /*
     * Determine if it was an ajax request by looking at
     * X-Requested-With=XMLHttpRequest request header. This header is set by
     * jQuery for every ajax request. In case the requested response is not json
     * then the decorator is empty. For json, a json response is sent
     */
    var nodecorator = false;

    if (request.getHttpHeaders().get("x-requested-with") === "XMLHttpRequest")
    {
        var format = request.httpParameterMap.format.stringValue || "";
        nodecorator = true;

        /*
         * the requested output format is json so the error response needs to be
         * json
         */
        if (format === "json")
        {
            response.renderJSON({
                Success : false,
                LogRequestID : request.requestID.indexOf('-') > 0 ? request.requestID.substr(0, request.requestID
                        .indexOf('-')) : request.requestID
            });

            return;
        }
    }

    // TODO CurrentStartNodeName?
    response.renderTemplate('error/generalerror', {
        PipelineName : PipelineName,
        ErrorText : ErrorText,
        nodecorator : nodecorator
    });
}

/**
 * Called by the system when a session hijacking was detected.
 */
function Forbidden()
{
    new dw.system.Pipelet('LogoutCustomer').execute();

    response.renderTemplate('error/forbidden');
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
exports.Start       = g.all(Start);
exports.Forbidden   = g.all(Forbidden);
