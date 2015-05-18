'use strict';

import client from '../client';
import config from '../config';

export const BTN_CONTINUE_BILLING_SAVE = 'button[name$="billing_save"]';
export const BTN_CONTINUE_SHIPPING_SAVE = '[name$="shippingAddress_save"]';
export const BTN_PLACE_ORDER = 'button[name$="submit"]';
export const LABEL_ORDER_THANK_YOU = '.primary-content h1';

const basePath = '/checkout';

export function navigateTo (path = basePath) {
	return client.url(config.url + path);
}

export function pressBtnCheckoutAsGuest () {
	return client.click('[name$="login_unregistered"]');
}

function _populateField (fieldType, selector, value) {
	switch (fieldType) {
		case 'input':
			client.setValue(selector, value);
			break;
		case 'selectByValue':
			client.selectByValue(selector, value);
			break;
		case 'selectByIndex':
			client.selectByIndex(selector, value);
			break;
	}
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
		var selector = '[name$="shippingAddress_addressFields_' + key + '"]';
		_populateField(fieldTypeMap.get(key), selector, value);
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
		var selector = '[name$="' + fieldMap.get(key).fieldPrefix + key + '"]';
		_populateField(fieldType, selector, value);
	}
	return client.pause(200);
}

export function checkUseAsBillingAddress () {
	return client.click('[name$="shippingAddress_useAsBillingAddress"]');
}

export function getLabelOrderConfirmation () {
	return client.getText(LABEL_ORDER_THANK_YOU);
}

export function getActiveBreadCrumb () {
	return client.getText('.checkout-progress-indicator .active');
}
