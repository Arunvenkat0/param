'use strict';

import client from '../client';
import config from '../config';
import * as formHelpers from './forms/helpers';

export const BTN_CONTINUE_BILLING_SAVE = 'button[name*="billing_save"]';
export const BTN_CONTINUE_SHIPPING_SAVE = '[name*="shippingAddress_save"]';
export const BTN_PLACE_ORDER = 'button[name*="submit"]';
export const CSS_ORDER_SUBTOTAL = '.order-subtotal td:nth-child(2)';
export const LABEL_ORDER_THANK_YOU = '.primary-content h1';
export const MINI_SECTION_SHIPPING_ADDR = '.mini-shipment';
export const MINI_SECTION_BILLING_ADDR = '.mini-billing-address';
export const MINI_SECTION_PMT_METHOD = '.mini-payment-instrument';
export const LINK_EDIT_ORDER_SUMMARY = 'a.section-header-note[href*="cart"]';
export const LINK_EDIT_SHIPPING_ADDR = MINI_SECTION_SHIPPING_ADDR + ' a';
export const LINK_EDIT_BILLING_ADDR = MINI_SECTION_BILLING_ADDR + ' a';
export const LINK_EDIT_PMT_METHOD = MINI_SECTION_PMT_METHOD + ' a';
export const MINI_SHIPPING_ADDR_DETAILS = MINI_SECTION_SHIPPING_ADDR + ' .details';
export const MINI_BILLING_ADDR_DETAILS = MINI_SECTION_BILLING_ADDR + ' .details';
export const MINI_PMT_METHOD_DETAILS = MINI_SECTION_PMT_METHOD + ' .details';
export const RADIO_BTN_PAYPAL = 'input[value="PayPal"]';

const basePath = '/checkout';

export function navigateTo (path = basePath) {
	return client.url(config.url + path);
}

export function pressBtnCheckoutAsGuest () {
	return client.click('[name*="login_unregistered"]');
}

export function fillOutShippingForm (shippingData) {
	var fieldTypeMap = new Map();

	fieldTypeMap.set('firstName', 'input');
	fieldTypeMap.set('lastName', 'input');
	fieldTypeMap.set('address1', 'input');
	fieldTypeMap.set('address2', 'input');
	fieldTypeMap.set('country', 'selectByValue');
	fieldTypeMap.set('states_state', 'selectByValue');
	fieldTypeMap.set('city', 'input');
	fieldTypeMap.set('postal', 'input');
	fieldTypeMap.set('phone', 'input');

	for (var [key, value] of shippingData) {
		var selector = '[name*="shippingAddress_addressFields_' + key + '"]';
		formHelpers.populateField(selector, value, fieldTypeMap.get(key));
	}

	return client;
}

export function fillOutBillingForm (billingFields) {
	var fieldMap = new Map();

	fieldMap.set('emailAddress', {
		type: 'input',
		fieldPrefix: 'billing_billingAddress_email_'
	});
	fieldMap.set('creditCard_owner', {
		type: 'input',
		fieldPrefix: 'billing_paymentMethods_'
	});
	fieldMap.set('creditCard_number', {
		type: 'input',
		fieldPrefix: 'billing_paymentMethods_'
	});
	fieldMap.set('creditCard_year', {
		type: 'selectByIndex',
		fieldPrefix: 'billing_paymentMethods_'
	});
	fieldMap.set('creditCard_cvn', {
		type: 'input',
		fieldPrefix: 'billing_paymentMethods_'
	});

	for (var [key, value] of billingFields) {
		var fieldType = fieldMap.get(key).type;
		var selector = '[name*="' + fieldMap.get(key).fieldPrefix + key + '"]';
		formHelpers.populateField(selector, value, fieldType);
	}
	return client.pause(200);
}

export function checkUseAsBillingAddress () {
	return client.click('[name*="shippingAddress_useAsBillingAddress"]');
}

export function getLabelOrderConfirmation () {
	return client.getText(LABEL_ORDER_THANK_YOU);
}

export function getActiveBreadCrumb () {
	return client.getText('.checkout-progress-indicator .active');
}

export function getOrderSubTotal () {
	return client.getText(CSS_ORDER_SUBTOTAL);
}
