'use strict';

/**
 * This pipeline is called whenever a technical error occurs while processing a
 * request. A standard error page will be shown.
 *
 * @module controller/Error
 */

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var view = require('~/cartridge/scripts/_view');

/**
 * Called by the system when an error was not handled locally (general error
 * page). In: PipelineName ErrorText
 */
function start(args) {

    /*
     * Determine if it was an ajax request by looking at
     * X-Requested-With=XMLHttpRequest request header. This header is set by
     * jQuery for every ajax request. In case the requested response is not json
     * then the decorator is empty. For json, a json response is sent
     */
    var nodecorator = false;

    if (request.getHttpHeaders().get("x-requested-with") === "XMLHttpRequest") {
        var format = request.httpParameterMap.format.stringValue || "";
        nodecorator = true;

        // the requested output format is json so the error response needs to be json
        if (format === "json") {
            response.renderJSON({
                Success      : false,
                LogRequestID : request.requestID.indexOf('-') > 0 ? request.requestID.substr(0, request.requestID.indexOf('-')) : request.requestID
            });

            return;
        }
    }

    view.get({
        PipelineName : args.PipelineName,
        CurrentStartNodeName : args.CurrentStartNodeName,
        ErrorText    : args.ErrorText,
        nodecorator  : nodecorator
    }).render('error/generalerror');

}

/**
 * Called by the system when a session hijacking was detected.
 */
function forbidden() {

	// TODO replace with Script API equivalent
	new dw.system.Pipelet('LogoutCustomer').execute();
    view.get().render('error/forbidden');

}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/Error~start */
exports.Start = guard.all(start);
/** @see module:controller/Error~forbidden */
exports.Forbidden = guard.all(forbidden);
