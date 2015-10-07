'use strict';

/**
 * This controller reports to the Demandware AB-test engine when a customer starts
 * checkout in the storefront. This event is recorded only for the purposes of updating AB-test statistics and
 * does not affect the basket. This controller does not ordinarily need to be customized.
 *
 * @module controllers/ABTestEvent
 */

/* API Includes */
var ISML = require('dw/template/ISML');
var Pipelet = require('dw/system/Pipelet');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * TODO
 */
function startCheckout() {
    var cart = app.getModel('Cart').get();

    if (cart) {
        new Pipelet('StartCheckout').execute({
            Basket : cart.object
        });
        ISML.renderTemplate('util/reporting/reporting');
    } else {
        ISML.renderTemplate('util/reporting/reporting');
    }
}

/*
* Module exports
*/

/*
* Web exposed methods
*/
/** @see module:controllers/ABTestEvent~startCheckout */
exports.StartCheckout = guard.ensure(['get'], startCheckout);
