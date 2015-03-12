'use strict';

/**
 * This is the pipeline hook for reporting to the Demandware AB-test engine that a customer has started
 * checkout in the storefront.  This event is recorded only fore the purposes of updating AB-test statistics and
 * does not affect the basket.  This pipeline does not ordinarily need to be modified.
 *
 * @module controller/ABTestEvent
 */

/* API Includes */
var Cart = require('~/cartridge/scripts/model/Cart');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');

/**
 * TODO
 */
function startCheckout() {
    var cart = Cart.get();

    if (cart) {
        new dw.system.Pipelet('StartCheckout').execute({
            Basket : cart.object
        });

        response.renderTemplate('util/reporting/reporting');
    }
    else {
        response.renderTemplate('util/reporting/reporting');
    }
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/ABTestEvent~startCheckout */
exports.StartCheckout = guard.filter(['get'], startCheckout);
