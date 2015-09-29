'use strict';

import {assert} from 'chai';
import client from '../webdriver/client';
import * as addressPage from '../pageObjects/addressBook';
import * as testData from '../pageObjects/testData/main';
import * as loginForm from '../pageObjects/helpers/forms/login';

describe('Address', () => {
	let login = 'testuser1@demandware.com';

	let testAddressEditedTextTitle = 'Test Address Edited';
	let testAddressTitle = 'ZZZZZ Test Address';

	let addressFormData = {};
	let editAddressFormData = {};

	before(() => client.init()
		.then(() => testData.getCustomerByLogin(login))
		.then(customer => {
			let address = customer.getPreferredAddress();

			addressFormData = {
				addressid: 'ZZZZZ Test Address',
				firstname: 'The Muffin',
				lastname: 'Mann',
				address1: '211 Drury Lane',
				city: 'Far Far Away',
				states_state: address.stateCode,
				postal: '04330',
				country: address.countryCode,
				phone: address.phone
			};

			editAddressFormData = {
				addressid: 'Test Address Edited',
				firstname: 'The Muffin',
				lastname: 'Mann',
				address1: '211 Drury Lane',
				city: 'Far Far Away',
				states_state: address.stateCode,
				postal: '04330',
				country: address.countryCode,
				phone: address.phone
			};

		})

		.then(() => addressPage.navigateTo())
		.then(() => loginForm.loginAsDefaultCustomer())
		.then(() => client.waitForVisible(addressPage.LINK_CREATE_ADDRESS))
		.then(() => addressPage.removeAddresses())

	);

	// We have deleted all of the address except for 'Home' and 'Work'.
	// When all other address are deleted there is no default address.
	// Clicking MAKE_DEFAULT_ADDRESS selects the last address and maske that the defualt.
	// This sets the addressBook back to the original import set up.
	// This is becasue the addresses are displayed in alphabetical order. When the other address
	// are deleted Home is displayed before Work everytime.
	// This allows for 'Home' to be set as the default.

	after(() => client.refresh()
		.then(() => client.click(addressPage.MAKE_DEFAULT_ADDRESS))
		.then(() => client.end())
	);

	it('should bring up the address form', () =>
		client.click(addressPage.LINK_CREATE_ADDRESS)
			.then(() => client.waitForVisible(addressPage.FORM_ADDRESS))
			.then(() => client.isVisible(addressPage.FORM_ADDRESS))
			.then(visible => assert.isTrue(visible))
	);

	it('should fill out the form to add test address', () =>

		addressPage.fillAddressForm(addressFormData)
			.then(() => client.click(addressPage.BTN_FORM_CREATE))
			.then(() => client.waitUntil(() =>
				client.getText(addressPage.LAST_ADDRESS_TITLE)
					.then(
						text => text === testAddressTitle,
						err => false
				)
			))
			.then(() => client.getText(addressPage.LAST_ADDRESS_TITLE))
			.then(displayText => assert.equal(displayText, testAddressTitle))
	);

	it('should edit Test Address', () =>
		addressPage.editAddress(testAddressTitle, editAddressFormData)
		.then(() => client.waitUntil(() =>
			addressPage.getAddressTitles()
				.then(titles => titles.indexOf(editAddressFormData.addressid) > -1)
		))
		.then(() => client.getText(addressPage.TITLE_ADDRESS_SELECTOR))
		.then(addressTexts =>
			assert.isAbove(addressTexts.indexOf(testAddressEditedTextTitle), -1,
				testAddressEditedTextTitle + 'is found in the address')
		)

	);

	it('should make the Last Address (test address) the default address', () => {
		let targetTitle;
		return client.getText(addressPage.LAST_ADDRESS_TITLE)
			.then(title => targetTitle = title)
			.then(() => client.click(addressPage.MAKE_LAST_DEFAULT_ADDRESS)
				.getText(addressPage.FIRST_ADDRESS_TITLE)
		)
			.then(defaultTitle => assert.equal(defaultTitle, targetTitle));
	});

	it('should delete unused addresses', () =>
		addressPage.removeAddresses()
			.then(() => addressPage.getAddressCount())
			.then(() => client.getText(addressPage.TITLE_ADDRESS_SELECTOR))
			.then(titlesLeft => assert.deepEqual(Array.sort(titlesLeft), ['Home', 'Work']))
	);

});
