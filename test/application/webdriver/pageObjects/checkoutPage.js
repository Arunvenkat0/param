'use strict';

var BaseClass = require('./BaseClass');
var CHECKOUT_PATH = '/checkout';

const BTN_CHECKOUT_AS_GUEST = '[name$="login_unregistered"]';
const BTN_CONTINUE_BILLING_SAVE = 'button[name$="billing_save"]';
const BTN_CONTINUE_SHIPPING_SAVE = '[name$="shippingAddress_save"]';
const BTN_PLACE_ORDER = 'button[name$="submit"]';
const BREADCRUMB_NAV_HEADER = '.checkout-progress-indicator';
const BREADCRUMB_SHIPPING = BREADCRUMB_NAV_HEADER + ' .step-1';
const BREADCRUMB_BILLING = BREADCRUMB_NAV_HEADER + ' .step-2';
const BREADCRUMB_PLACE_ORDER = BREADCRUMB_NAV_HEADER + ' .step-3';
const CKBX_USE_AS_BILLING_ADDRESS = '[name$="shippingAddress_useAsBillingAddress"]';
const CSS_FIELD_SUFFIX = '"]';
const LABEL_ORDER_THANK_YOU = '.primary-content h1';


class CheckoutPage extends BaseClass {
	constructor(client, loggingLevel) {
		super(client, loggingLevel);
		this.basePath = CHECKOUT_PATH;
	}

	checkoutAsGuest () {
		return this.client
			.click(BTN_CHECKOUT_AS_GUEST)
			.getAttribute(BREADCRUMB_SHIPPING, 'class');
	}

	_populateField (fieldType, selector, value) {
		switch(fieldType) {
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
			var selector = lastFilledField = '[name$="' + fieldMap.get(key).fieldPrefix + key + '"]';
			this._populateField(fieldType, selector, value);
		}

		return this.client.addValue(lastFilledField, 'Tab');
	}

	checkUseAsBillingAddress () {
		return this.client.click(CKBX_USE_AS_BILLING_ADDRESS);
	}

	canSaveShippingAddress () {
		return this.client.isEnabled(BTN_CONTINUE_SHIPPING_SAVE);
	}

	saveShippingAddress () {
		return this.client.click(BTN_CONTINUE_SHIPPING_SAVE);
	}

	hasShippingAddressBeenSaved () {
		return this.client.getAttribute(BREADCRUMB_BILLING, 'class');
	}

	isBillingContinueButtonEnabled () {
		return this.client.isEnabled(BTN_CONTINUE_BILLING_SAVE);
	}

	pressBillingContinueBtn () {
		return this.client.click(BTN_CONTINUE_BILLING_SAVE);
	}

	isBillingInfoSaved () {
		return this.client.getAttribute(BREADCRUMB_PLACE_ORDER, 'class');
	}

	isPlaceOrderButtonEnabled () {
		return this.client.isEnabled(BTN_PLACE_ORDER);
	}

	clickSubmitButtion () {
		return this.client.click(BTN_PLACE_ORDER);
	}

	isOrderSubmitted () {
		return this.client.getText(LABEL_ORDER_THANK_YOU);
	}
}


module.exports = CheckoutPage;
