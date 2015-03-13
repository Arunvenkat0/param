'use strict';

/**
 * Controller implements the first step of the cart checkout process, which is to ask the customer to login, register or
 * checkout anonymously.
 *
 * @module controller/COCustomer
 */

/* API Includes */
var Cart = require('~/cartridge/scripts/model/Cart');
var Transaction = require('~/cartridge/scripts/transaction');

/* Script Modules */
var loginAsset = require('~/cartridge/scripts/model/Content').get('myaccount-login');
var guard = require('~/cartridge/scripts/guard');
var loginForm = require('~/cartridge/scripts/model/Form').get('login');
var pageMeta = require('~/cartridge/scripts/meta');
var view = require('~/cartridge/scripts/view');

/**
 * First step of the checkout: provide to choose checkout type (returning, guest or create account)
 */
function start() {
    /**
     * Prepares the checkout initially: removes all payment instruments from the basket and clears all
     * forms used in the checkout process, when the customer enters the checkout. The single steps (shipping, billing etc.)
     * may not contain the form clearing in order to support navigating forth and back in the checkout steps without losing
     * already entered form values.
     */
    session.forms.singleshipping.clearFormElement();
    session.forms.multishipping.clearFormElement();
    session.forms.billing.clearFormElement();

    Transaction.autocommit(function () {
        Cart.goc().removeAllPaymentInstruments;
    });

	/*
	 * Direct to first checkout step if already authenticated
	 */
    if (customer.authenticated) {
	    response.redirect(dw.web.URLUtils.https('COShipping-Start'));
        return;
    }
	else {
	    session.forms.login.clearFormElement();

	    /*
	     * Prepopulate login form field with customer's login name
	     */
	    if (customer.registered) {
		    session.forms.login.username.value = customer.profile.credentials.login;
	    }

	    pageMeta.update(loginAsset);
	    view.get().render('checkout/checkoutlogin');
    }

}

/**
 * TODO
 */
function showLoginForm() {
	var formResult = loginForm.handleAction({
		'login'        : function (formgroup) {
			/*
			 * Delegate login to appropriate authentication pipeline and react on success/failure
			 */
			var loginResult = require('./Login').Process();

            if (loginResult.login_succeeded) {
                response.redirect(dw.web.URLUtils.https('COShipping-Start'));
                return;
            }
            else {
	            return {};
            }
		},
		'register'     : function (formgroup) {
			// TODO - redirect to COShipping-Start after registration was successful
			response.redirect(dw.web.URLUtils.https('Account-StartRegister'));

			return;
		},
		'unregistered' : function (formgroup) {
			response.redirect(dw.web.URLUtils.https('COShipping-Start'));

			return;
		}
	});

	if (formResult) {
		pageMeta.update(loginAsset);
		view.get().render('checkout/checkoutlogin');
	}
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controller/COCustomer~start */
exports.Start = guard.ensure(['https'], start);
/** @see module:controller/COCustomer~showLoginForm */
exports.LoginForm = guard.ensure(['https', 'post'], showLoginForm);
