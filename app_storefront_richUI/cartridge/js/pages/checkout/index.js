'use strict';

var ajax = require('../../ajax'),
	progress = require('../../progress'),
	tooltip = require('../../tooltip'),
	util = require('../../util');

var address = require('./address'),
	billing = require('./billing'),
	multiship = require('./multiship');

var $cache = {};

/**
 * @function
 * @description Initializes the cache of the checkout UI
 */
function initializeCache() {
	$cache.checkoutForm = $(".address");
	$cache.firstName = $cache.checkoutForm.find("input[name$='_firstName']");
	$cache.lastName = $cache.checkoutForm.find("input[name$='_lastName']");
	$cache.address1 = $cache.checkoutForm.find("input[name$='_address1']");
	$cache.address2 = $cache.checkoutForm.find("input[name$='_address2']");
	$cache.city = $cache.checkoutForm.find("input[name$='_city']");
	$cache.postalCode = $cache.checkoutForm.find("input[name$='_postal']");
	$cache.phone = $cache.checkoutForm.find("input[name$='_phone']");
	$cache.countryCode = $cache.checkoutForm.find("select[id$='_country']");
	$cache.stateCode = $cache.checkoutForm.find("select[id$='_state']");

	if ($cache.checkoutForm.hasClass("checkout-billing")) {
		// billing only
		$cache.ccContainer = $("#PaymentMethod_CREDIT_CARD");
		$cache.ccOwner = $cache.ccContainer.find("input[name$='creditCard_owner']");
		$cache.ccType = $cache.ccContainer.find("select[name$='_type']");
		$cache.ccNum = $cache.ccContainer.find("input[name$='_number']");
		$cache.ccMonth = $cache.ccContainer.find("[name$='_month']");
		$cache.ccYear = $cache.ccContainer.find("[name$='_year']");
		$cache.ccCcv = $cache.ccContainer.find("input[name$='_cvn']");
	}
}
/**
 * @function Initializes the page events depending on the checkout stage (shipping/billing)
 */
function initializeEvents() {
	address.init();
	if ($(".checkout-shipping").length > 0) {
		shipping.init();
		//on the single shipping page, update the list of shipping methods when the state feild changes
		$('#dwfrm_singleshipping_shippingAddress_addressFields_states_state').bind('change', function(){
			shipping.updateShippingMethodList();
		});
	} else if ($(".checkout-multi-shipping").length > 0) {
		multiship.init();
	} else{
		billing.init();
	}

	//if on the order review page and there are products that are not available diable the submit order button
	if($('.order-summary-footer').length > 0){
		if($('.notavailable').length > 0){
			$('.order-summary-footer .submit-order .button-fancy-large').attr( 'disabled', 'disabled' );
		}
	}
}

exports.init = function () {
	initializeCache();
	initializeEvents();
};
