'use strict';

/**
 * This controller is called whenever a technical error occurs while processing a
 * request. A standard error page is rendered.
 *
 * @module controllers/Error
 */

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Called by the system when an error was not handled locally (general error
 * page).
 *
 * @param {Object} args The arguments
 * @param {String} args.ErrorText The error message
 * @param {String} args.ControllerName The controller which caused the error
 * @param {String} args.CurrentStartNodeName The endpoint name causing the error.
 */
function start(args) {
    /*
     * Determine if it was an AJAX request by looking at
     * X-Requested-With=XMLHttpRequest request header. This header is set by
     * jQuery for every AJAX request. If the requested response format is not json
     * then the decorator is empty. If it is json, a JSON response is sent.
     */
    var nodecorator = false;

    if (request.getHttpHeaders().get('x-requested-with') === 'XMLHttpRequest') {
        var format = request.httpParameterMap.format.stringValue || '';
        nodecorator = true;

        // The requested output format is json so the error response needs to be JSON.
        if (format === 'json') {
            let r = require('~/cartridge/scripts/util/Response');
            r.renderJSON({
                Success: false,
                LogRequestID: request.requestID.split('-')[0]
            });

            return;
        }
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        if ('isIncludeRequest' in request) {
            if (request.isIncludeRequest()) {
                nodecorator = true;
            } else {
                response.setStatus(410);
            }
        }
        app.getView({
            PipelineName: args.ControllerName,
            CurrentStartNodeName: args.CurrentStartNodeName,
            ErrorText: args.ErrorText,
            nodecorator: nodecorator
        }).render('error/generalerror');
    }
}

/**
 * Called by the system when a session hijacking was detected.
 */
function forbidden() {
    app.getModel('Customer').logout();
    app.getView().render('error/forbidden');
}

/*
 * Web exposed methods
 */
/** @see module:controllers/Error~start */
exports.Start = guard.all(start);
/** @see module:controllers/Error~forbidden */
exports.Forbidden = guard.all(forbidden);
