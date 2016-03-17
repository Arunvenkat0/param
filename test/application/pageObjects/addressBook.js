'use strict';

import _ from 'lodash';
import * as formHelpers from './helpers/forms/common';

export const BTN_EDIT_ADDRESS = 'button[name*=address_edit]';
export const BTN_FORM_CREATE = 'button[name*=create]';
export const EDIT_ADDRESS = '.address-tile:first-of-type .address-edit';
export const FIRST_ADDRESS_TITLE = '.default .mini-address-title';
export const FORM_ADDRESS = '.ui-dialog';
export const LAST_ADDRESS_TITLE = '.address-tile:last-of-type .mini-address-title';
export const LINK_CREATE_ADDRESS = '.address-create';
export const MAKE_DEFAULT_ADDRESS = '.address-tile:last-of-type .address-make-default';
export const MAKE_LAST_DEFAULT_ADDRESS = '.address-tile:last-of-type .address-make-default';
export const TITLE_ADDRESS_SELECTOR = '.address-list li .mini-address-title';
export const ADDRESS_SELECTOR = '.address-list li';

const basePath = '/addressbook';

export function navigateTo () {
    return browser.url(basePath);
}

export function fillAddressForm (addressFormData) {
    let fieldsPromise = [];

    let fieldTypes = {
        addressid: 'input',
        firstname: 'input',
        lastname: 'input',
        address1: 'input',
        city: 'input',
        postal: 'input',
        states_state: 'selectByValue',
        country: 'selectByValue',
        phone: 'input'
    };

    _.each(addressFormData, (value, key) => {
        let selector = '[name*=profile_address_' + key + ']';
        fieldsPromise.push(formHelpers.populateField(selector, value, fieldTypes[key]));
    });

    return Promise.all(fieldsPromise);
}

export function getAddressTitles () {
    // This assumes that the client is already on the My Account > Addresses page
    return browser.getText(TITLE_ADDRESS_SELECTOR);
}

export function removeAddresses () {
    let defaultAddresses = ['Home', 'Work'];

    // get all address titles
    return browser.getText('.address-list li .mini-address-title')
        .then(addressTexts => {
            // filter out Home and Work addresses
            return addressTexts.filter(function (addressText) {
                return defaultAddresses.indexOf(addressText) === -1;
            });
        })
        // remove addresses sequentially
        .then(addressTextsToRemove => {
	    return addressTextsToRemove.reduce(function (removeTask, addressText, addressIndex) {
                return removeTask.then(() => {
                    return browser.element('li*=' + addressText)
                        .click('.delete')
                        .alertAccept();
		}).then(() => browser.waitUntil(() =>
		    // wait until the address is removed, i.e.
		    // there is one less addresses to be removed
		    getAddressCount().then(count => count === defaultAddresses.length + addressTextsToRemove.length
		    - (addressIndex + 1))
		));
            }, Promise.resolve());
        })
        .then(() => browser.waitUntil(() =>
            getAddressCount().then(count => count === defaultAddresses.length)
        ));
}

export function getAddressCount () {
    return browser.elements(ADDRESS_SELECTOR)
        .then(rows => rows.value.length);
}

/**
 * edit the address title from origialAddress to something defined in editAddressFormData
 * @param originalAddress
 * @param editAddressFormData
 * @returns {Promise.}
 */
export function editAddress(originalAddress, editAddressFormData) {
    // get all address titles
    return browser.getText(TITLE_ADDRESS_SELECTOR)
        .then(addressTexts => {
            // filter out Home and Work addresses
            return addressTexts.filter(function (addressText) {
                return addressText === originalAddress;
            });
        })
        .then((addressToEdit) => browser.element('li*=' + addressToEdit))
        .click('.address-edit')
        .then(() => browser.waitForVisible(FORM_ADDRESS))
        .then(() => fillAddressForm(editAddressFormData))
        .then(() => browser.click(BTN_EDIT_ADDRESS))
        .waitForVisible(FORM_ADDRESS, 500, true);
}
