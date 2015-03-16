'use strict';

/**
 * Controller used to update the current session currency.
 *
 * @module controller/Currency
 */

/* API Includes */
var Currency = require('dw/util/Currency');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');

/**
 * This controller is used in an ajax call to set the session variable 'currency'.
 */
function setSessionCurrency() {

    var currencyMnemonic = request.httpParameterMap.currencyMnemonic.value;

    if (currencyMnemonic) {
        var currency = Currency.getCurrency(currencyMnemonic);
        if (currency) {
            session.setCurrency(currency);

            var CartController = require('./Cart');
            CartController.Calculate();
        }
    }

    response.renderJSON({
        success : true
    });

}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/Currency~setSessionCurrency */
exports.SetSessionCurrency = guard.ensure(['get'], setSessionCurrency);
