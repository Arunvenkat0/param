'use strict';

/**
 * This controller updates the current session currency.
 *
 * @module controllers/Currency
 */

/* API Includes */
var Currency = require('dw/util/Currency');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var Cart = require('~/cartridge/scripts/models/CartModel');

/**
 * This controller is used in an AJAX call to set the session variable 'currency'.
 */
function setSessionCurrency() {

    var currencyMnemonic = request.httpParameterMap.currencyMnemonic.value;

    if (currencyMnemonic) {
        var currency = Currency.getCurrency(currencyMnemonic);
        if (currency) {
            session.setCurrency(currency);

            Transaction.wrap(function () {
                Cart.get().calculate();
            });
        }
    }

    let r = require('~/cartridge/scripts/util/Response');
    r.renderJSON({
        success: true
    });

}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/Currency~setSessionCurrency */
exports.SetSessionCurrency = guard.ensure(['get'], setSessionCurrency);
