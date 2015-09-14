'use strict';

import _ from 'lodash';
import client from '../client';
import * as formHelpers from './helpers/forms/common';

export const BTN_EDIT_ADDRESS = 'button[name*=address_edit]';
export const BTN_FORM_CREATE = 'button[name*=create]';
export const EDIT_ADDRESS = '.first .address-edit';
export const FIRST_ADDRESS_TITLE = '.first.default .mini-address-title';
export const FORM_ADDRESS = '.ui-dialog';
export const LAST_ADDRESS_TITLE = '.last .mini-address-title';
export const LINK_CREATE_ADDRESS = '.address-create';
export const MAKE_DEFAULT_ADDRESS = '.first .address-make-default';
export const MAKE_LAST_DEFAULT_ADDRESS = '.last .address-make-default';
export const TITLE_ADDRESS_SELECTOR = '.address-list li .mini-address-title';

const basePath = '/addressbook';

export function navigateTo () {
	return client.url(basePath);
}

export function fillAddressForm (addressFormData) {
	let fieldsPromise = [];

	let fieldTypes = {
		addressid: 'input',
		firstname: 'input',
		lastname: 'input',
		address1: 'input',
		city: 'input',
		states_state: 'selectByValue',
		postal: 'input',
		country: 'selectByValue',
		phone: 'input'
	};

	_.each(addressFormData, (value, key) => {
		let selector = '[name*=profile_address_' + key + ']';
		fieldsPromise.push(formHelpers.populateField(selector, value, fieldTypes[key]));
	});

	return Promise.all(fieldsPromise);
}

export function removeAddresses () {
	// get all address titles
	return client.getText('.address-list li .mini-address-title')
		.then(addressTexts => {
			// filter out Home and Work addresses
			return addressTexts.filter(function (addressText) {
				return addressText !== 'Home' && addressText !== 'Work';
			});
		})
		// remove addresses sequentially
		.then(addressTextsToRemove => {
			return addressTextsToRemove.reduce(function (removeTask, addressText) {
				return removeTask.then(() => {
					return client.element('li*=' + addressText)
						.click('.delete')
						.alertAccept();
				});
			}, Promise.resolve());
		});
}
