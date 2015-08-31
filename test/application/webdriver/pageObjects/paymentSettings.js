'use strict';

import _ from 'lodash';
import client from '../client';
import * as formHelpers from './helpers/forms/common';

export const FORM_CREDIT_CARD = 'form[name*=CreditCardForm]';
export const DISPLAYED_CREDIT_CARD = '.first';

export const LINK_ADD_CREDIT_CARD = '[class*=add-card]';
export const BTN_CREATE_CARD = '#applyBtn';
export const BTN_DELETE_CREDIT_CARD = '[class*=delete]';

export const VISA_CREDIT_CARD = '[class*=Visa]';
export const AMEX_CREDIT_CARD = '[class*=Amex]';
export const MASTER_CREDIT_CARD = '[class*=MasterCard]';
export const DISCOVER_CREDIT_CARD = '[class*=Discover]';

export const BTN_DELETE_VISA_CARD = '.Visa .delete';
export const BTN_DELETE_AMEX_CARD = '.Amex .delete';
export const BTN_DELETE_MASTER_CARD = '.MasterCard .delete';
export const BTN_DELETE_DISCOVER_CARD = '.Discover .delete';



const basePath = '/wallet';

export function navigateTo () {
	return client.url(basePath);
}

export function fillOutCreditCardForm (creditCardData) {
	let fieldTypes = new Map();
	let fieldsPromise = [];

	fieldTypes.set('owner', 'input');
	fieldTypes.set('type', 'selectByValue');
	fieldTypes.set('number', 'input');
	fieldTypes.set('expiration_year', 'selectByValue');

	_.each(creditCardData, (value, key) => {
		let selector = '[name*="newcreditcard_' + key + '"]';
		fieldsPromise.push(formHelpers.populateField(selector, value, fieldTypes.get(key)));
	});
	return Promise.all(fieldsPromise);
}
