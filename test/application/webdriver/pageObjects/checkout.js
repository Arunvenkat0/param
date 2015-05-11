'use strict';

var Base = require('./base');

class CheckoutPage extends Base {
	constructor(client, loggingLevel) {
		super(client, loggingLevel);
		this.basePath = '/checkout';

		this.btnContinueBillingSave = 'button[name$="billing_save"]';
		this.btnContinueShippingSave = '[name$="shippingAddress_save"]';
		this.btnPlaceOrder = 'button[name$="submit"]';
		this.labelOrderThankYou = '.primary-content h1';
	}

	pressBtnCheckoutAsGuest () {
		return this.client.click('[name$="login_unregistered"]');
	}

	_populateField (fieldType, selector, value) {
		switch (fieldType) {
			case 'input':
				this.client.setValue(selector, value);
				break;
			case 'selectByValue':
				this.client.selectByValue(selector, value);
				break;
			case 'selectByIndex':
				this.client.selectByIndex(selector, value);
				break;
		}
	}

	fillOutShippingForm (shippingData) {
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

		var fieldPrefix = 'shippingAddress_addressFields_';
		for (var [key, value] of shippingData) {
			var selector = '[name$="' + fieldPrefix + key + '"]';
			this._populateField(fieldTypeMap.get(key), selector, value);
		}

		return this.client;
	}

	fillOutBillingForm (billingFields) {
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

		// Keeps track of most recently filled in field.  Will be used to insert
		// a tab character to remove focus from it before form submission
		var lastFilledField;

		for (var [key, value] of billingFields) {
			var fieldType = fieldMap.get(key).type;
			var selector = '[name$="' + fieldMap.get(key).fieldPrefix + key + '"]';
			lastFilledField = selector;
			this._populateField(fieldType, selector, value);
		}

		return this.client.addValue(lastFilledField, 'Tab');
	}

	checkUseAsBillingAddress () {
		return this.client.click('[name$="shippingAddress_useAsBillingAddress"]');
	}

	getLabelOrderConfirmation () {
		return this.client.getText(this.labelOrderThankYou);
	}

	getActiveBreadCrumb () {
		return this.client.getText('.checkout-progress-indicator .active');
	}
}

module.exports = CheckoutPage;
